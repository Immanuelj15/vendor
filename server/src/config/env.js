import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

if (!process.env.MONGO_URI) {
  throw new Error('FATAL CONFIG ERROR: MONGO_URI is required in environment variables!');
}
if (!process.env.JWT_ACCESS_SECRET) {
  throw new Error('FATAL CONFIG ERROR: JWT_ACCESS_SECRET is required in environment variables!');
}
if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error('FATAL CONFIG ERROR: JWT_REFRESH_SECRET is required in environment variables!');
}

if (isProduction) {
  if (!process.env.RAZORPAY_KEY_ID) {
    throw new Error('FATAL CONFIG ERROR: RAZORPAY_KEY_ID is required in production!');
  }
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('FATAL CONFIG ERROR: RAZORPAY_KEY_SECRET is required in production!');
  }
}

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fairkart',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'fairkart_access_secret_2026',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fairkart_refresh_secret_2026',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_demo',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_demo',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_demo',
};
