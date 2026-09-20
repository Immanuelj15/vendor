import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { CustomerProfile } from '../src/models/CustomerProfile.js';
import { AdminProfile } from '../src/models/AdminProfile.js';
import { SuperAdminProfile } from '../src/models/SuperAdminProfile.js';
import { Vendor } from '../src/models/Vendor.js';
import { VendorBankAccount } from '../src/models/VendorBankAccount.js';
import { ROLES } from '../src/constants/roles.js';

async function migrateRoleArchitecture() {
  console.log('====================================================');
  console.log('  FAIRKART ROLE ARCHITECTURE & PROFILE DATA MIGRATION');
  console.log('====================================================');

  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('[Database] Connected to MongoDB');

    const db = mongoose.connection.db;

    // 1. Canonical role cleanup: Migrate all legacy 'USER' records to 'CUSTOMER'
    const legacyUserCount = await db.collection('users').countDocuments({ role: 'USER' });
    if (legacyUserCount > 0) {
      const updateResult = await db.collection('users').updateMany(
        { role: 'USER' },
        { $set: { role: 'CUSTOMER' } }
      );
      console.log(`[Role Migration] Migrated ${updateResult.modifiedCount} legacy 'USER' accounts to 'CUSTOMER'`);
    } else {
      console.log("[Role Migration] Zero legacy 'USER' roles found (already clean)");
    }

    // 2. Populate CustomerProfiles for all CUSTOMER accounts
    const customers = await User.find({ role: ROLES.CUSTOMER });
    let customersCreated = 0;
    for (const cust of customers) {
      const existingProfile = await CustomerProfile.findOne({ userId: cust._id });
      if (!existingProfile) {
        const parts = (cust.name || '').trim().split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
        await CustomerProfile.create({
          userId: cust._id,
          firstName,
          lastName,
          referralCode: cust.referralCode || '',
          referredBy: cust.referredBy || null,
        });
        customersCreated++;
      }
    }
    console.log(`[Profile Migration] Verified ${customers.length} Customers. Created ${customersCreated} new CustomerProfiles`);

    // 3. Populate AdminProfiles for all ADMIN accounts
    const admins = await User.find({ role: ROLES.ADMIN });
    let adminsCreated = 0;
    for (const adm of admins) {
      const existingProfile = await AdminProfile.findOne({ userId: adm._id });
      if (!existingProfile) {
        const parts = (adm.name || '').trim().split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
        await AdminProfile.create({
          userId: adm._id,
          firstName,
          lastName,
          department: 'GENERAL',
        });
        adminsCreated++;
      }
    }
    console.log(`[Profile Migration] Verified ${admins.length} Admins. Created ${adminsCreated} new AdminProfiles`);

    // 4. Populate SuperAdminProfiles for all SUPER_ADMIN accounts
    const superAdmins = await User.find({ role: ROLES.SUPER_ADMIN });
    let superAdminsCreated = 0;
    for (const sa of superAdmins) {
      const existingProfile = await SuperAdminProfile.findOne({ userId: sa._id });
      if (!existingProfile) {
        const parts = (sa.name || '').trim().split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
        await SuperAdminProfile.create({
          userId: sa._id,
          firstName,
          lastName,
        });
        superAdminsCreated++;
      }
    }
    console.log(`[Profile Migration] Verified ${superAdmins.length} Super Admins. Created ${superAdminsCreated} new SuperAdminProfiles`);

    // 5. Verify & Sync Indexes
    console.log('[Index Verification] Ensuring critical unique indexes...');
    try {
      const existingBankIndexes = await db.collection('vendorbankaccounts').indexes();
      const hasOldIndex = existingBankIndexes.some(idx => idx.name === 'vendorId_1' && !idx.unique);
      if (hasOldIndex) {
        await db.collection('vendorbankaccounts').dropIndex('vendorId_1');
        console.log('[Index Verification] Dropped old non-unique vendorId_1 index on vendorbankaccounts');
      }
    } catch (idxErr) {
      // Ignore if collection or index does not exist
    }

    await CustomerProfile.init();
    await AdminProfile.init();
    await SuperAdminProfile.init();
    await Vendor.init();
    await VendorBankAccount.init();
    await User.init();
    console.log('[Index Verification] All unique and relational indexes confirmed active');

    console.log('====================================================');
    console.log('  MIGRATION COMPLETED SUCCESSFULLY');
    console.log('====================================================');

    await mongoose.disconnect();
  } catch (err) {
    console.error('[Migration Error]', err);
    process.exit(1);
  }
}

migrateRoleArchitecture();
