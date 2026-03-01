import path from 'path';
import dotenv from 'dotenv';

const env = process.env.NODE_ENV || 'development';
dotenv.config({ path: path.resolve(process.cwd(), `.env.${env}`) });

console.log(`🔧 Environment: ${env}`);
console.log(`📁 Loaded config from: .env.${env}`);

// Fail fast: these secrets are required to sign JWTs securely
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required');
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error('SESSION_SECRET environment variable is required');
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '5m',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || jwtSecret,
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  refreshTokenTtlMs: (() => {
    const ttl = parseInt(process.env.REFRESH_TOKEN_TTL_MS || '604800000', 10);
    if (!Number.isFinite(ttl) || ttl <= 0) {
      throw new Error('REFRESH_TOKEN_TTL_MS must be a positive integer (milliseconds)');
    }
    return ttl;
  })(), // 7 days default
  sessionSecret,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5174',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || '',
  },
  nodeEnv: env,
  adminUserIds: (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean),
  rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== 'false',
};
