import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fairkart');
await User.updateOne({ email: 'admin@fairkart.dev' }, { role: 'SUPER_ADMIN', status: 'ACTIVE' });
await User.deleteMany({ role: 'SUPER_ADMIN', email: { $ne: 'admin@fairkart.dev' } });
const supers = await User.find({ role: 'SUPER_ADMIN' });
console.log('Active Super Admins in DB:', supers.length, supers.map(s => s.email));
await mongoose.disconnect();
