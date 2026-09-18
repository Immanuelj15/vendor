import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env.js';

// Fix for Node.js SRV lookup issues on Windows / certain ISPs
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  console.warn('[Database] Failed to set custom DNS servers:', err.message);
}

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
    // Non-blocking throw so server can gracefully log or retry depending on environment
    throw error;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] Mongoose disconnected from MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('[Database Error] Connection error:', err);
});
