// API Configuration
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000'  // Development
  : 'https://your-production-api.com';  // Production

// For Android emulator, use 10.0.2.2 instead of localhost
// For iOS simulator, localhost works fine
export const getApiBaseUrl = () => {
  if (__DEV__) {
    // Platform-specific handling can be added here
    return 'http://10.0.2.2:3000'; // Android emulator
    // return 'http://localhost:3000'; // iOS simulator
  }
  return 'https://your-production-api.com';
};

