import mongoose from 'mongoose';
import { env } from '../src/config/env.js';

async function migrateRoles() {
  try {
    await mongoose.connect(env.MONGO_URI);
    const db = mongoose.connection.db;

    const countBefore = await db.collection('users').countDocuments({ role: 'USER' });
    console.log(`Found ${countBefore} users with role 'USER'`);

    if (countBefore > 0) {
      const result = await db.collection('users').updateMany(
        { role: 'USER' },
        { $set: { role: 'CUSTOMER' } }
      );
      console.log(`Successfully migrated ${result.modifiedCount} users to role 'CUSTOMER'`);
    }

    const distribution = await db.collection('users').aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]).toArray();
    console.log('Updated role distribution:', distribution);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Migration error:', err);
  }
}

migrateRoles();
