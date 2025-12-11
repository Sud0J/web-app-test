# Setup Guide

Complete setup instructions for the Encrypted Messenger application.

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn
- For mobile: React Native development environment (Expo CLI)
- For Android: Android Studio (for native Android development)
- For iOS: Xcode (for native iOS development)

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
MONGODB_URI=mongodb://localhost:27017/encrypted-messenger
WS_PORT=3001
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RSA_KEY_SIZE=4096
AES_KEY_SIZE=256
```

### 3. Start MongoDB

If using local MongoDB:

```bash
# macOS/Linux
mongod

# Windows
# Start MongoDB service or run mongod.exe
```

Or use MongoDB Atlas (cloud) and update `MONGODB_URI` in `.env`.

### 4. Run the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

### 5. Run Tests

```bash
npm test
```

## React Native Mobile App Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure API Endpoint

Edit `mobile/src/config/constants.js`:

```javascript
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000'  // iOS Simulator
  // ? 'http://10.0.2.2:3000'  // Android Emulator
  : 'https://your-production-api.com';
```

**Note:** 
- For iOS Simulator: use `localhost:3000`
- For Android Emulator: use `10.0.2.2:3000`
- For physical devices: use your computer's local IP address (e.g., `http://192.168.1.100:3000`)

### 3. Install Expo CLI (if not already installed)

```bash
npm install -g expo-cli
```

### 4. Start the App

```bash
# Start Expo development server
npm start

# Or run on specific platform
npm run ios      # iOS Simulator
npm run android  # Android Emulator
```

### 5. Important: Encryption Implementation

The mobile app's encryption utilities (`src/utils/encryption.js`) are placeholders. For production, you need to:

1. **Install native crypto libraries:**
   ```bash
   npm install react-native-rsa-native react-native-aes-crypto
   ```

2. **Link native modules:**
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Implement proper encryption** using these libraries or create native modules in Java/Kotlin (Android) and Swift (iOS).

## Android Native Setup (Java/Kotlin)

### 1. Open in Android Studio

```bash
cd android-native
# Open the project in Android Studio
```

### 2. Configure API Endpoint

Update `Config.java` or `Config.kt` with your backend URL.

### 3. Add Dependencies

The project should include:
- OkHttp for WebSocket
- Retrofit for REST API
- Gson for JSON parsing
- Android Keystore for secure key storage

### 4. Build and Run

Build the APK or run directly on a device/emulator from Android Studio.

## Flutter App Setup

### 1. Install Flutter

Follow the [Flutter installation guide](https://flutter.dev/docs/get-started/install).

### 2. Install Dependencies

```bash
cd flutter-app
flutter pub get
```

### 3. Configure API Endpoint

Update the API base URL in the configuration file.

### 4. Run the App

```bash
flutter run
```

## Testing with Postman

### Import API Collection

1. Open Postman
2. Import the collection from `docs/postman-collection.json` (if available)
3. Set the environment variable `base_url` to `http://localhost:3000`

### Test Endpoints

1. **Register User:**
   - POST `/api/auth/register`
   - Body: `{ "username": "testuser", "email": "test@example.com", "password": "password123" }`

2. **Login:**
   - POST `/api/auth/login`
   - Body: `{ "email": "test@example.com", "password": "password123" }`
   - Save the token from response

3. **Get Current User:**
   - GET `/api/auth/me`
   - Header: `Authorization: Bearer <token>`

4. **Search Users:**
   - GET `/api/users/search?q=username`
   - Header: `Authorization: Bearer <token>`

5. **Get Chat History:**
   - GET `/api/messages/chat/<chatId>`
   - Header: `Authorization: Bearer <token>`

## WebSocket Testing

You can test WebSocket connections using:

1. **Browser Console:**
   ```javascript
   const socket = io('http://localhost:3000', {
     auth: { token: 'your-jwt-token' }
   });
   
   socket.on('connect', () => console.log('Connected'));
   socket.emit('message:send', {
     receiverId: 'receiver-user-id',
     content: 'Hello!',
     messageType: 'text'
   });
   ```

2. **Postman WebSocket:**
   - Create a new WebSocket request
   - URL: `ws://localhost:3000`
   - Add authentication in connection parameters

## Troubleshooting

### Backend Issues

- **MongoDB Connection Error:** Ensure MongoDB is running and `MONGODB_URI` is correct
- **Port Already in Use:** Change `PORT` in `.env` or kill the process using port 3000
- **JWT Errors:** Ensure `JWT_SECRET` is set in `.env`

### Mobile App Issues

- **Connection Refused:** Check API URL and ensure backend is running
- **Encryption Errors:** Implement proper native crypto modules (see encryption implementation section)
- **WebSocket Not Connecting:** Check CORS settings and authentication token

### Common Solutions

1. **Clear cache and reinstall:**
   ```bash
   # Backend
   rm -rf node_modules package-lock.json
   npm install
   
   # Mobile
   cd mobile
   rm -rf node_modules
   npm install
   expo start -c
   ```

2. **Check firewall/network:** Ensure ports 3000 and 3001 are not blocked

3. **Verify environment variables:** Double-check all `.env` values

## Production Deployment

### Backend

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure proper MongoDB connection (preferably MongoDB Atlas)
4. Set up SSL/TLS certificates
5. Use a process manager like PM2
6. Configure reverse proxy (nginx)

### Mobile Apps

1. Update API endpoint to production URL
2. Implement proper encryption with native modules
3. Enable code obfuscation
4. Configure app signing
5. Test on real devices

## Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Use HTTPS in production
- [ ] Implement rate limiting (already included)
- [ ] Use secure password hashing (bcrypt - already implemented)
- [ ] Implement proper key storage (Android Keystore, iOS Keychain)
- [ ] Add input validation (already included)
- [ ] Enable CORS properly for production
- [ ] Regular security audits
- [ ] Implement message deletion
- [ ] Add two-factor authentication (optional)

## Next Steps

1. Implement native encryption modules for mobile
2. Add file/media sharing
3. Implement group chats
4. Add push notifications
5. Implement message reactions
6. Add voice/video calls (optional)
7. Create desktop client (eframe/Rust)

