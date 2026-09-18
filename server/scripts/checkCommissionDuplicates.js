import mongoose from 'mongoose';
import { env } from '../src/config/env.js';

async function checkDuplicates() {
  try {
    await mongoose.connect(env.MONGO_URI);
    const db = mongoose.connection.db;

    const duplicates = await db.collection('commissions').aggregate([
      {
        $match: {
          subscriptionId: { $ne: null },
          level: { $ne: null },
          recipientUserId: { $ne: null }
        }
      },
      {
        $group: {
          _id: {
            subscriptionId: '$subscriptionId',
            level: '$level',
            recipientUserId: '$recipientUserId'
          },
          count: { $sum: 1 },
          ids: { $push: '$_id' }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    console.log('Duplicate commission sets found:', duplicates.length);
    if (duplicates.length > 0) {
      console.log('Duplicates:', JSON.stringify(duplicates, null, 2));
    }

    // Also check orderId + suborderId + recipientUserId duplicates
    const orderDuplicates = await db.collection('commissions').aggregate([
      {
        $match: {
          orderId: { $ne: null },
          suborderId: { $ne: null },
          recipientUserId: { $ne: null }
        }
      },
      {
        $group: {
          _id: {
            orderId: '$orderId',
            suborderId: '$suborderId',
            recipientUserId: '$recipientUserId'
          },
          count: { $sum: 1 },
          ids: { $push: '$_id' }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    console.log('Duplicate order commission sets found:', orderDuplicates.length);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkDuplicates();
