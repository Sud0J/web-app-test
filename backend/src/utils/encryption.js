const crypto = require('crypto');

const RSA_KEY_SIZE = parseInt(process.env.RSA_KEY_SIZE) || 4096;
const AES_KEY_SIZE = parseInt(process.env.AES_KEY_SIZE) || 256;
const AES_ALGORITHM = 'aes-256-gcm';

/**
 * Generate RSA key pair
 * @returns {Object} { publicKey, privateKey }
 */
function generateRSAKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: RSA_KEY_SIZE,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  return { publicKey, privateKey };
}

/**
 * Generate AES key
 * @returns {Buffer} AES key
 */
function generateAESKey() {
  return crypto.randomBytes(AES_KEY_SIZE / 8);
}

/**
 * Encrypt data with AES-256-GCM
 * @param {string} data - Data to encrypt
 * @param {Buffer} key - AES key
 * @returns {Object} { encrypted, iv, authTag }
 */
function encryptAES(data, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(AES_ALGORITHM, key, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

/**
 * Decrypt data with AES-256-GCM
 * @param {string} encryptedData - Encrypted data
 * @param {Buffer} key - AES key
 * @param {string} iv - Initialization vector (hex)
 * @param {string} authTag - Authentication tag (hex)
 * @returns {string} Decrypted data
 */
function decryptAES(encryptedData, key, iv, authTag) {
  const decipher = crypto.createDecipheriv(
    AES_ALGORITHM,
    key,
    Buffer.from(iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Encrypt data with RSA public key
 * @param {string} data - Data to encrypt
 * @param {string} publicKey - RSA public key (PEM format)
 * @returns {string} Encrypted data (base64)
 */
function encryptRSA(data, publicKey) {
  const buffer = Buffer.from(data, 'utf8');
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    buffer
  );
  return encrypted.toString('base64');
}

/**
 * Decrypt data with RSA private key
 * @param {string} encryptedData - Encrypted data (base64)
 * @param {string} privateKey - RSA private key (PEM format)
 * @returns {string} Decrypted data
 */
function decryptRSA(encryptedData, privateKey) {
  const buffer = Buffer.from(encryptedData, 'base64');
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    buffer
  );
  return decrypted.toString('utf8');
}

/**
 * Hybrid encryption: Encrypt message with AES, then encrypt AES key with RSA
 * @param {string} message - Message to encrypt
 * @param {string} receiverPublicKey - Receiver's RSA public key
 * @returns {Object} { encryptedMessage, encryptedKey, iv, authTag }
 */
function hybridEncrypt(message, receiverPublicKey) {
  // Generate AES key for this message
  const aesKey = generateAESKey();
  
  // Encrypt message with AES
  const { encrypted, iv, authTag } = encryptAES(message, aesKey);
  
  // Encrypt AES key with receiver's public key
  const encryptedKey = encryptRSA(aesKey.toString('hex'), receiverPublicKey);
  
  return {
    encryptedMessage: encrypted,
    encryptedKey,
    iv,
    authTag
  };
}

/**
 * Hybrid decryption: Decrypt AES key with RSA, then decrypt message with AES
 * @param {string} encryptedMessage - Encrypted message
 * @param {string} encryptedKey - RSA-encrypted AES key
 * @param {string} iv - Initialization vector
 * @param {string} authTag - Authentication tag
 * @param {string} privateKey - Receiver's RSA private key
 * @returns {string} Decrypted message
 */
function hybridDecrypt(encryptedMessage, encryptedKey, iv, authTag, privateKey) {
  // Decrypt AES key with private key
  const aesKeyHex = decryptRSA(encryptedKey, privateKey);
  const aesKey = Buffer.from(aesKeyHex, 'hex');
  
  // Decrypt message with AES key
  const message = decryptAES(encryptedMessage, aesKey, iv, authTag);
  
  return message;
}

/**
 * Generate message signature for integrity verification
 * @param {string} message - Message to sign
 * @param {string} privateKey - Sender's private key
 * @returns {string} Signature (base64)
 */
function signMessage(message, privateKey) {
  const sign = crypto.createSign('SHA256');
  sign.update(message);
  sign.end();
  return sign.sign(privateKey, 'base64');
}

/**
 * Verify message signature
 * @param {string} message - Original message
 * @param {string} signature - Message signature
 * @param {string} publicKey - Sender's public key
 * @returns {boolean} True if signature is valid
 */
function verifySignature(message, signature, publicKey) {
  const verify = crypto.createVerify('SHA256');
  verify.update(message);
  verify.end();
  return verify.verify(publicKey, signature, 'base64');
}

module.exports = {
  generateRSAKeyPair,
  generateAESKey,
  encryptAES,
  decryptAES,
  encryptRSA,
  decryptRSA,
  hybridEncrypt,
  hybridDecrypt,
  signMessage,
  verifySignature
};

