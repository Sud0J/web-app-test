# Encrypted Messenger App

A secure, end-to-end encrypted messaging application similar to Telegram, built with modern technologies.

## Tech Stack

### Frontend/Mobile
- **React Native** (JavaScript) - Cross-platform mobile development
- **Flutter** (Dart) - Alternative cross-platform option
- **Java/Kotlin** - Native Android client
- **eframe** (Rust) - Desktop client option

### Backend
- **Node.js** - Backend services
- **Express.js** - Web framework
- **WebSocket** (Socket.io) - Real-time communication

### Database
- **Firebase** - Real-time data storage and synchronization
- **MongoDB** - Alternative database option

### Encryption
- **AES-256-GCM** - Symmetric encryption for message content
- **RSA-4096** - Asymmetric encryption for key exchange

### Development Tools
- **Git & GitHub** - Version control
- **Jest** - Unit testing
- **Postman** - API testing
- **Figma** - UI/UX design

## Project Structure

```
encrypted-messenger/
├── backend/              # Node.js backend server
├── mobile/               # React Native mobile app
├── android-native/       # Java/Kotlin native Android client
├── flutter-app/          # Flutter alternative client
├── desktop/              # eframe (Rust) desktop client
└── docs/                 # Documentation
```

## Features

- ✅ End-to-end encryption (AES + RSA)
- ✅ Real-time messaging via WebSocket
- ✅ User authentication
- ✅ Secure key exchange
- ✅ Message history
- ✅ Multi-device support
- ✅ Group chats (future)

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the server:
```bash
npm run dev
```

### Mobile App Setup (React Native)

1. Navigate to mobile directory:
```bash
cd mobile
npm install
```

2. For iOS:
```bash
cd ios && pod install && cd ..
npm run ios
```

3. For Android:
```bash
npm run android
```

## Security Features

- End-to-end encryption ensures only the sender and receiver can read messages
- RSA key exchange for secure initial communication
- AES-256-GCM for fast, secure message encryption
- Secure random key generation
- Message authentication codes (MAC) for integrity verification

## Development

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Mobile app tests
cd mobile && npm test
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

