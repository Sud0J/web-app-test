const {
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
} = require('../src/utils/encryption');

describe('Encryption Utilities', () => {
  test('should generate RSA key pair', () => {
    const { publicKey, privateKey } = generateRSAKeyPair();
    expect(publicKey).toBeDefined();
    expect(privateKey).toBeDefined();
    expect(publicKey).toContain('BEGIN PUBLIC KEY');
    expect(privateKey).toContain('BEGIN PRIVATE KEY');
  });

  test('should generate AES key', () => {
    const key = generateAESKey();
    expect(key).toBeInstanceOf(Buffer);
    expect(key.length).toBe(32); // 256 bits = 32 bytes
  });

  test('should encrypt and decrypt with AES', () => {
    const message = 'Hello, World!';
    const key = generateAESKey();
    const { encrypted, iv, authTag } = encryptAES(message, key);
    
    expect(encrypted).toBeDefined();
    expect(iv).toBeDefined();
    expect(authTag).toBeDefined();

    const decrypted = decryptAES(encrypted, key, iv, authTag);
    expect(decrypted).toBe(message);
  });

  test('should encrypt and decrypt with RSA', () => {
    const { publicKey, privateKey } = generateRSAKeyPair();
    const message = 'Hello, World!';
    
    const encrypted = encryptRSA(message, publicKey);
    expect(encrypted).toBeDefined();

    const decrypted = decryptRSA(encrypted, privateKey);
    expect(decrypted).toBe(message);
  });

  test('should perform hybrid encryption and decryption', () => {
    const { publicKey, privateKey } = generateRSAKeyPair();
    const message = 'This is a secret message!';
    
    const { encryptedMessage, encryptedKey, iv, authTag } = hybridEncrypt(message, publicKey);
    
    expect(encryptedMessage).toBeDefined();
    expect(encryptedKey).toBeDefined();
    expect(iv).toBeDefined();
    expect(authTag).toBeDefined();

    const decrypted = hybridDecrypt(encryptedMessage, encryptedKey, iv, authTag, privateKey);
    expect(decrypted).toBe(message);
  });

  test('should sign and verify message', () => {
    const { publicKey, privateKey } = generateRSAKeyPair();
    const message = 'This message needs to be signed';
    
    const signature = signMessage(message, privateKey);
    expect(signature).toBeDefined();

    const isValid = verifySignature(message, signature, publicKey);
    expect(isValid).toBe(true);

    const isValidWrong = verifySignature('Different message', signature, publicKey);
    expect(isValidWrong).toBe(false);
  });
});

