// environment.ts - FIXED VERSION
export const environment = {
  production: false,
  
  // ✅ CORRECT: Just the base URL, without /api/auth
  apiUrl: 'http://localhost:5000/api',
  
  appName: 'MediCare HMS',
  version: '1.0.0',
  tokenKey: 'hms_token',
  userKey: 'hms_user',
  enableLogs: true
};