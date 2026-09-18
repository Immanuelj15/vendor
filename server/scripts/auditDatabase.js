import mongoose from 'mongoose';
import { env } from '../src/config/env.js';

async function runAudit() {
  try {
    await mongoose.connect(env.MONGO_URI);
    const db = mongoose.connection.db;

    console.log('==================================================');
    console.log('          FAIRKART DATABASE AUDIT REPORT          ');
    console.log('==================================================\n');

    // 1. Users & Roles
    const users = await db.collection('users').find().toArray();
    console.log('1. USERS & ROLES AUDIT:');
    console.log('   Total users:', users.length);
    const rolesMap = {};
    let sensitiveExposed = 0;
    let nonHashedPasswords = 0;
    let duplicateEmails = 0;
    const emailSet = new Set();

    for (const u of users) {
      rolesMap[u.role] = (rolesMap[u.role] || 0) + 1;
      if (!u.passwordHash || !u.passwordHash.startsWith('$2')) {
        nonHashedPasswords++;
      }
      if (emailSet.has(u.email)) duplicateEmails++;
      emailSet.add(u.email);
    }
    console.log('   Roles Distribution:', JSON.stringify(rolesMap));
    console.log('   Non-bcrypt hashed passwords:', nonHashedPasswords);
    console.log('   Duplicate emails:', duplicateEmails);

    // 2. Wallets Audit
    console.log('\n2. WALLETS & LEDGERS AUDIT:');
    const wallets = await db.collection('wallets').find().toArray();
    console.log('   Total wallets:', wallets.length);
    let negativeWallets = 0;
    for (const w of wallets) {
      if (w.balance < 0) negativeWallets++;
    }
    console.log('   Negative balance wallets:', negativeWallets);

    // 3. Vendors Audit
    console.log('\n3. VENDORS AUDIT:');
    const vendors = await db.collection('vendors').find().toArray();
    console.log('   Total vendors:', vendors.length);
    let orphanVendors = 0;
    let negativeVendorBalances = 0;
    for (const v of vendors) {
      if (v.balance < 0 || v.pendingBalance < 0) negativeVendorBalances++;
      const user = users.find(u => u._id.toString() === v.userId?.toString());
      if (!user) orphanVendors++;
    }
    console.log('   Negative vendor balances:', negativeVendorBalances);
    console.log('   Orphan vendors (no valid User doc):', orphanVendors);

    // 4. Products Audit
    console.log('\n4. PRODUCTS AUDIT:');
    const products = await db.collection('products').find().toArray();
    console.log('   Total products:', products.length);
    let orphanProducts = 0;
    let negativeStock = 0;
    for (const p of products) {
      if (p.stock < 0) negativeStock++;
      const vendor = vendors.find(v => v._id.toString() === p.vendorId?.toString());
      if (!vendor) orphanProducts++;
    }
    console.log('   Negative stock products:', negativeStock);
    console.log('   Orphan products (no valid Vendor doc):', orphanProducts);

    // 5. Orders & Suborders Audit
    console.log('\n5. ORDERS & SUBORDERS AUDIT:');
    const orders = await db.collection('orders').find().toArray();
    const suborders = await db.collection('vendororders').find().toArray();
    console.log('   Total parent orders:', orders.length);
    console.log('   Total vendor suborders:', suborders.length);
    let orphanOrders = 0;
    for (const o of orders) {
      const user = users.find(u => u._id.toString() === o.userId?.toString());
      if (!user) orphanOrders++;
    }
    console.log('   Orphan orders (invalid userId):', orphanOrders);

    // 6. Payments Audit
    console.log('\n6. PAYMENTS AUDIT:');
    const payments = await db.collection('payments').find().toArray();
    console.log('   Total payment records:', payments.length);
    const paymentStatusMap = {};
    for (const pm of payments) {
      paymentStatusMap[pm.status] = (paymentStatusMap[pm.status] || 0) + 1;
    }
    console.log('   Payment statuses:', JSON.stringify(paymentStatusMap));

    // 7. Commissions Audit
    console.log('\n7. COMMISSIONS AUDIT:');
    const commissions = await db.collection('commissions').find().toArray();
    console.log('   Total commissions:', commissions.length);
    const commTypeMap = {};
    for (const c of commissions) {
      commTypeMap[c.type] = (commTypeMap[c.type] || 0) + 1;
    }
    console.log('   Commission types:', JSON.stringify(commTypeMap));

    // 8. MLM / Referral Network Audit
    console.log('\n8. MLM / REFERRALS AUDIT:');
    const referrals = await db.collection('referrals').find().toArray();
    console.log('   Total referral edges in network:', referrals.length);
    let circularReferrals = 0;
    for (const r of referrals) {
      if (r.userId?.toString() === r.referredUserId?.toString()) {
        circularReferrals++;
      }
    }
    console.log('   Self/Circular referrals found:', circularReferrals);

    // 9. Index Audit
    console.log('\n9. INDEXES SUMMARY:');
    const collections = [
      'users', 'vendors', 'products', 'orders', 'vendororders',
      'payments', 'commissions', 'wallets', 'cointransactions',
      'platformledgers', 'vendorledgers', 'vendorwithdrawals'
    ];
    for (const cName of collections) {
      const col = db.collection(cName);
      const indices = await col.indexes();
      const idxNames = indices.map(i => `${i.name}${i.unique ? ' [UNIQUE]' : ''}`);
      console.log(`   - ${cName} (${indices.length} indexes): ${idxNames.join(', ')}`);
    }

    console.log('\n==================================================');
    console.log('             AUDIT SCRIPT COMPLETED               ');
    console.log('==================================================');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Audit Script Error:', err);
  }
}

runAudit();
