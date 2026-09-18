import dns from 'dns';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

import { User } from '../src/models/User.js';
import { ROLES, USER_STATUS } from '../src/constants/roles.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fairkart';
const EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@fairkart.dev';
const PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'Password@123';
const NAME = process.env.SUPER_ADMIN_NAME || 'Super Admin';

async function seedSuperAdmin() {
  console.log('👑 Initializing Super Admin Seeding...\n');

  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(PASSWORD, salt);

    const superAdmin = await User.findOneAndUpdate(
      { email: EMAIL.toLowerCase().trim() },
      {
        name: NAME,
        email: EMAIL.toLowerCase().trim(),
        passwordHash,
        role: ROLES.SUPER_ADMIN,
        status: USER_STATUS.ACTIVE,
        emailVerified: true,
        referralCode: 'SUPER100',
        fairCoinBalance: 5000,
      },
      { upsert: true, new: true }
    );

    console.log(`\n🎉 Super Admin account ready:`);
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Role:  ${superAdmin.role}`);
    console.log(`   Status: ${superAdmin.status}`);
    console.log(`\n✨ Secure Super Admin setup complete.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed Super Admin:', error);
    process.exit(1);
  }
}

seedSuperAdmin();
