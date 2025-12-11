# Quick Start Guide

Get up and running in 5 minutes!

## Backend (5 minutes)

```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env
# Edit .env and set JWT_SECRET and MONGODB_URI

# 4. Start MongoDB (if local)
# Make sure MongoDB is running on your system

# 5. Start the server
npm run dev
```

Backend will be running on `http://localhost:3000`

## Mobile App (React Native)

```bash
# 1. Navigate to mobile app
cd mobile

# 2. Install dependencies
npm install

# 3. Update API URL in src/config/constants.js
# For iOS Simulator: http://localhost:3000
# For Android Emulator: http://10.0.2.2:3000

# 4. Start Expo
npm start

# 5. Press 'i' for iOS or 'a' for Android
```

## Test the App

1. **Register a new user** in the mobile app
2. **Login** with your credentials
3. **Search for users** to start a chat
4. **Send messages** - they're encrypted end-to-end!

## Important Notes

⚠️ **Encryption Implementation:** The mobile app's encryption utilities are placeholders. For production use, you need to implement native crypto modules. See `SETUP.md` for details.

⚠️ **Private Keys:** Currently, private keys are returned during registration. In production, implement secure key storage using:
- Android: Android Keystore
- iOS: iOS Keychain
- React Native: expo-secure-store or react-native-keychain

## Next Steps

- Read `SETUP.md` for detailed setup instructions
- Check `docs/API.md` for API documentation
- Implement native encryption modules for mobile
- Set up production environment

## Troubleshooting

**Backend won't start?**
- Check if MongoDB is running
- Verify `.env` file exists and has correct values
- Check if port 3000 is available

**Mobile app can't connect?**
- Verify backend is running
- Check API URL in `src/config/constants.js`
- For Android emulator, use `10.0.2.2` instead of `localhost`
- For physical device, use your computer's local IP address

**Need help?** Check `SETUP.md` for detailed troubleshooting.

