import path from 'path';
import dotenv from 'dotenv';

const env = process.env.NODE_ENV || 'development';
dotenv.config({ path: path.resolve(process.cwd(), `.env.${env}`) });

console.log(`🔧 Environment: ${env}`);
console.log(`📁 Loaded config from: .env.${env}`);

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '5m',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || '',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  refreshTokenTtlMs: parseInt(process.env.REFRESH_TOKEN_TTL_MS || '604800000', 10), // 7 days
  sessionSecret: process.env.SESSION_SECRET || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5174',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || '',
  },
  nodeEnv: env,
  adminUserIds: (process.env.ADMIN_USER_IDS || '').split(',').filter(Boolean),
};
