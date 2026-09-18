import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/User.js';
import { Referral } from '../src/models/Referral.js';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fairkart_dev';

async function runMigration() {
  console.log('🚀 Starting Referral Network Migration (3 Levels -> 9 Levels)...');

  try {
    await mongoose.connect(mongoUri);
    console.log(`✅ Connected to MongoDB at: ${mongoUri}`);

    const users = await User.find({});
    console.log(`🔍 Loaded ${users.length} users from database.`);

    // Build a user map for fast lookup
    const userMap = new Map();
    for (const u of users) {
      userMap.set(u._id.toString(), u);
    }

    let successCount = 0;
    let failureCount = 0;

    for (const user of users) {
      try {
        const path = [];
        let currentId = user._id.toString();
        let loopUser = user;
        let circularDetected = false;

        // Traverse up the referredBy sponsor chain to compute complete ancestry path
        while (loopUser && loopUser.referredBy) {
          const sponsorId = loopUser.referredBy.toString();
          
          if (path.includes(sponsorId) || sponsorId === user._id.toString()) {
            console.warn(`⚠️ Circular reference detected for user [${user.name} / ${user.email}]. Stopping traversal.`);
            circularDetected = true;
            break;
          }

          path.unshift(sponsorId); // push ancestor to the beginning to maintain chronological order
          loopUser = userMap.get(sponsorId);
        }

        // 1. Update the referralPath on the User document
        await User.updateOne({ _id: user._id }, { $set: { referralPath: path } });

        // 2. Build and upsert the Referral collection documents up to 9 levels
        const len = path.length;
        for (let level = 1; level <= 9; level++) {
          if (len - level >= 0) {
            const ancestorId = path[len - level];
            
            // Perform idempotent upsert
            await Referral.updateOne(
              { userId: ancestorId, referredUserId: user._id },
              { $set: { level, status: 'ACTIVE' } },
              { upsert: true }
            );
          }
        }

        successCount++;
      } catch (err) {
        console.error(`❌ Migration failed for user [${user.name} / ${user._id}]:`, err.message);
        failureCount++;
      }
    }

    console.log('\n======================================');
    console.log('🎉 Migration Finished!');
    console.log(`   Successes: ${successCount}`);
    console.log(`   Failures:  ${failureCount}`);
    console.log('======================================\n');

  } catch (err) {
    console.error('💥 Critical migration error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

runMigration();
