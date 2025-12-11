# API Documentation

Complete API reference for the Encrypted Messenger backend.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string (3-30 chars)",
  "email": "string (valid email)",
  "password": "string (min 6 chars)",
  "displayName": "string (optional, max 50 chars)"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt-token",
  "user": {
    "_id": "user-id",
    "username": "testuser",
    "email": "test@example.com",
    "displayName": "Test User",
    "publicKey": "RSA public key"
  },
  "privateKey": "RSA private key (store securely)"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt-token",
  "user": {
    "_id": "user-id",
    "username": "testuser",
    "email": "test@example.com",
    "displayName": "Test User"
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "_id": "user-id",
    "username": "testuser",
    "email": "test@example.com",
    "displayName": "Test User",
    "publicKey": "RSA public key",
    "isOnline": true,
    "lastSeen": "2024-01-01T00:00:00.000Z"
  }
}
```

### Users

#### Search Users
```http
GET /api/users/search?q=searchterm
Authorization: Bearer <token>
```

**Response:**
```json
{
  "users": [
    {
      "_id": "user-id",
      "username": "testuser",
      "displayName": "Test User",
      "avatar": "avatar-url",
      "isOnline": true,
      "lastSeen": "2024-01-01T00:00:00.000Z",
      "publicKey": "RSA public key"
    }
  ]
}
```

#### Get User by ID
```http
GET /api/users/:userId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "_id": "user-id",
    "username": "testuser",
    "displayName": "Test User",
    "avatar": "avatar-url",
    "isOnline": true,
    "lastSeen": "2024-01-01T00:00:00.000Z",
    "publicKey": "RSA public key"
  }
}
```

#### Update Profile
```http
PUT /api/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "displayName": "string (optional)",
  "avatar": "string (optional)"
}
```

### Messages

#### Get Chat History
```http
GET /api/messages/chat/:chatId?limit=50&before=timestamp
Authorization: Bearer <token>
```

**Parameters:**
- `chatId`: Format is `userId1_userId2` (sorted alphabetically)
- `limit`: Number of messages to retrieve (default: 50)
- `before`: ISO timestamp to get messages before this time

**Response:**
```json
{
  "messages": [
    {
      "_id": "message-id",
      "senderId": {
        "_id": "user-id",
        "username": "sender",
        "displayName": "Sender Name",
        "avatar": "avatar-url"
      },
      "receiverId": {
        "_id": "user-id",
        "username": "receiver",
        "displayName": "Receiver Name"
      },
      "chatId": "user1_user2",
      "content": "message content (plaintext - only for sender)",
      "encryptedContent": "encrypted message",
      "messageType": "text",
      "encryptionKey": "RSA-encrypted AES key",
      "iv": "initialization vector",
      "signature": "message signature",
      "isRead": false,
      "isDelivered": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Mark Messages as Read
```http
PUT /api/messages/read
Authorization: Bearer <token>
Content-Type: application/json

{
  "messageIds": ["message-id-1", "message-id-2"]
}
```

#### Delete Message
```http
DELETE /api/messages/:messageId
Authorization: Bearer <token>
```

## WebSocket Events

### Connection

Connect to WebSocket server:
```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'jwt-token' }
});
```

### Client → Server Events

#### Send Message
```javascript
socket.emit('message:send', {
  receiverId: 'receiver-user-id',
  content: 'Message text',
  messageType: 'text' // 'text', 'image', 'file', 'audio', 'video'
});
```

#### Typing Indicator - Start
```javascript
socket.emit('typing:start', {
  receiverId: 'receiver-user-id'
});
```

#### Typing Indicator - Stop
```javascript
socket.emit('typing:stop', {
  receiverId: 'receiver-user-id'
});
```

#### Mark Messages as Read
```javascript
socket.emit('message:read', {
  messageIds: ['message-id-1', 'message-id-2']
});
```

### Server → Client Events

#### New Message
```javascript
socket.on('message:new', (data) => {
  const { message } = data;
  // message contains encrypted content, keys, etc.
  // Decrypt using your private key
});
```

#### Message Sent Confirmation
```javascript
socket.on('message:sent', (data) => {
  const { messageId, chatId } = data;
  // Message was successfully sent and saved
});
```

#### User Online
```javascript
socket.on('user:online', (data) => {
  const { userId } = data;
  // User came online
});
```

#### User Offline
```javascript
socket.on('user:offline', (data) => {
  const { userId } = data;
  // User went offline
});
```

#### Typing Indicator - Start
```javascript
socket.on('typing:start', (data) => {
  const { userId, username } = data;
  // User is typing
});
```

#### Typing Indicator - Stop
```javascript
socket.on('typing:stop', (data) => {
  const { userId } = data;
  // User stopped typing
});
```

#### Message Read Receipt
```javascript
socket.on('message:read', (data) => {
  const { messageIds, readBy } = data;
  // Messages were read by recipient
});
```

## Encryption Flow

### Message Encryption (Hybrid)

1. **Generate AES key** for the message
2. **Encrypt message** with AES-256-GCM
3. **Encrypt AES key** with receiver's RSA public key
4. **Sign message** with sender's RSA private key
5. **Send** encrypted message, encrypted key, IV, auth tag, and signature

### Message Decryption

1. **Receive** encrypted message, encrypted key, IV, auth tag, and signature
2. **Decrypt AES key** with receiver's RSA private key
3. **Decrypt message** with AES key
4. **Verify signature** with sender's RSA public key

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message"
}
```

**Status Codes:**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (access denied)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate-limited:
- **Window:** 15 minutes (configurable)
- **Max Requests:** 100 per window (configurable)
- **Response:** `429 Too Many Requests` when exceeded

## Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

