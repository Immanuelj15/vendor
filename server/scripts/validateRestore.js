/**
 * FairKart Restored Database Validation Suite
 * Validates Collection Counts, Indexes, Financial Balances,
 * runs Financial Reconciliation against the restored test database,
 * and simulates core authentication & entity queries.
 */

import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const RESTORED_DB_NAME = 'FairKart_Restore_Test';
const BASE_MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fairkart';
const RESTORED_MONGO_URI = BASE_MONGO_URI.replace(/\/[^/?]+(\?|$)/, `/${RESTORED_DB_NAME}$1`);

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    testsPassed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    testsFailed++;
  }
}

async function validateRestoredDatabase() {
  console.log('================================================================');
  console.log('    FAIRKART RESTORE DRILL VERIFICATION & VALIDATION SUITE      ');
  console.log('================================================================');
  console.log(`Restored DB URI: ${RESTORED_MONGO_URI}\n`);

  const conn = await mongoose.createConnection(RESTORED_MONGO_URI).asPromise();
  const db = conn.db;

  try {
    // -------------------------------------------------------------
    // 1. COLLECTION COUNTS & EXISTENCE VERIFICATION
    // -------------------------------------------------------------
    console.log('--- 1. Validating Core Collections in Restored Database ---');
    const requiredCollections = [
      'users',
      'vendors',
      'products',
      'orders',
      'vendororders',
      'payments',
      'wallets',
      'wallettransactions',
      'cointransactions',
      'vendorledgers',
      'platformledgers',
      'commissions',
      'vendorsettlements',
      'vendorwithdrawals',
      'referrals',
      'auditlogs',
      'webhookevents',
      'settings'
    ];

    const collections = await db.listCollections().toArray();
    const colNames = collections.map(c => c.name.toLowerCase());

    for (const reqCol of requiredCollections) {
      const exists = colNames.includes(reqCol);
      assert(exists, `Collection "${reqCol}" is present in restored database`);
    }

    // -------------------------------------------------------------
    // 2. DOCUMENT COUNT & INDEX VERIFICATION
    // -------------------------------------------------------------
    console.log('\n--- 2. Validating Document Counts & Critical Indexes ---');
    const userCount = await db.collection('users').countDocuments();
    const vendorCount = await db.collection('vendors').countDocuments();
    const productCount = await db.collection('products').countDocuments();
    const orderCount = await db.collection('orders').countDocuments();
    const walletCount = await db.collection('wallets').countDocuments();
    const walletTxCount = await db.collection('wallettransactions').countDocuments();
    const coinTxCount = await db.collection('cointransactions').countDocuments();
    const commissionCount = await db.collection('commissions').countDocuments();
    const auditLogCount = await db.collection('auditlogs').countDocuments();

    assert(userCount > 0, `Users collection populated (${userCount} records)`);
    assert(vendorCount > 0, `Vendors collection populated (${vendorCount} records)`);
    assert(productCount > 0, `Products collection populated (${productCount} records)`);
    assert(walletCount > 0, `Wallets collection populated (${walletCount} records)`);
    assert(walletTxCount > 0, `WalletTransactions collection populated (${walletTxCount} records)`);
    assert(coinTxCount > 0, `CoinTransactions collection populated (${coinTxCount} records)`);
    assert(commissionCount > 0, `Commissions collection populated (${commissionCount} records)`);
    assert(auditLogCount > 0, `AuditLogs collection populated (${auditLogCount} records)`);

    // Verify Unique Indexes in Restored DB
    const userIndexes = await db.collection('users').indexes();
    const emailIndex = userIndexes.find(idx => idx.key && idx.key.email === 1);
    assert(Boolean(emailIndex && emailIndex.unique), 'User.email unique index restored and active');

    const orderIndexes = await db.collection('orders').indexes();
    const orderNumberIdx = orderIndexes.find(idx => idx.key && idx.key.orderNumber === 1);
    assert(Boolean(orderNumberIdx && orderNumberIdx.unique), 'Order.orderNumber unique index restored and active');

    // -------------------------------------------------------------
    // 3. FINANCIAL INTEGRITY IN RESTORED DATABASE
    // -------------------------------------------------------------
    console.log('\n--- 3. Reconciling Financial Balances in Restored Database ---');
    // Sum Wallet balances vs WalletTransactions
    const wallets = await db.collection('wallets').find().toArray();
    let walletMismatchCount = 0;
    for (const w of wallets) {
      const txs = await db.collection('wallettransactions').find({ walletId: w._id }).toArray();
      let computed = 0;
      for (const t of txs) {
        if (t.direction === 'CREDIT') computed += t.amount;
        else if (t.direction === 'DEBIT') computed -= t.amount;
      }
      if (Math.abs((w.balance || 0) - computed) > 0.01) {
        walletMismatchCount++;
      }
    }
    assert(walletMismatchCount === 0, `Restored Wallets Reconciled: 0 mismatches across all ${wallets.length} wallets`);

    // Sum Vendor balances vs VendorLedger
    const vendors = await db.collection('vendors').find().toArray();
    let vendorMismatchCount = 0;
    for (const v of vendors) {
      const ledgers = await db.collection('vendorledgers').find({ vendorId: v._id }).toArray();
      let computed = 0;
      for (const l of ledgers) {
        computed += (l.credit || 0) - (l.debit || 0);
      }
      if (Math.abs((v.balance || 0) - computed) > 0.01) {
        vendorMismatchCount++;
      }
    }
    assert(vendorMismatchCount === 0, `Restored Vendor Balances Reconciled: 0 mismatches across all ${vendors.length} vendors`);

    // Platform Ledger Continuity
    const platformTxs = await db.collection('platformledgers').find().sort({ createdAt: 1 }).toArray();
    let platformRunning = 0;
    for (const p of platformTxs) {
      platformRunning += (p.credit || 0) - (p.debit || 0);
    }
    const latestPlatform = platformTxs[platformTxs.length - 1];
    assert(
      Math.abs((latestPlatform?.balanceSnapshot || 0) - platformRunning) < 0.01,
      `Restored Platform Ledger Reconciled: Snapshot (₹${latestPlatform?.balanceSnapshot || 0}) matches Running Sum (₹${platformRunning})`
    );

    // -------------------------------------------------------------
    // 4. SIMULATED APPLICATION READINESS TESTS (MULTI-ROLE LOGIN)
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Multi-Role Authentication on Restored Database ---');
    const rolesToTest = ['SUPER_ADMIN', 'ADMIN', 'VENDOR', 'CUSTOMER'];
    for (const role of rolesToTest) {
      const user = await db.collection('users').findOne({ role });
      assert(Boolean(user), `Restored user found for role: ${role} (${user?.email || 'N/A'})`);
      if (user && user.passwordHash) {
        const passwordMatches = await bcrypt.compare('Password@123', user.passwordHash);
        assert(passwordMatches, `Password hash verification PASS for role ${role}`);
      }
    }

    // -------------------------------------------------------------
    // 5. QUERY INTEGRITY FOR PRODUCTS, ORDERS, MLM
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Business Entity Traversal on Restored DB ---');
    const sampleProduct = await db.collection('products').findOne({ isDeleted: false });
    assert(Boolean(sampleProduct && sampleProduct.price > 0), `Product query verified: "${sampleProduct?.name}" (₹${sampleProduct?.price})`);

    const sampleOrder = await db.collection('orders').findOne();
    if (sampleOrder) {
      const suborders = await db.collection('vendororders').find({ parentOrderId: sampleOrder._id }).toArray();
      assert(Array.isArray(suborders), `Order #${sampleOrder.orderNumber} successfully resolved ${suborders.length} child VendorOrder(s)`);
    }

    const commissions = await db.collection('commissions').find().toArray();
    assert(commissions.length > 0, `MLM Commission records intact (${commissions.length} commissions found)`);

  } catch (err) {
    console.error('Validation failure:', err);
    testsFailed++;
  } finally {
    await conn.close();
    console.log('\n================================================================');
    console.log(`TOTAL RESTORE VALIDATION TESTS: ${testsPassed + testsFailed} | PASSED: ${testsPassed} | FAILED: ${testsFailed}`);
    console.log('================================================================\n');
    process.exit(testsFailed > 0 ? 1 : 0);
  }
}

validateRestoredDatabase();
