import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import { connectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Vendor } from '../src/models/Vendor.js';
import { Wallet } from '../src/models/Wallet.js';
import { WalletTransaction } from '../src/models/WalletTransaction.js';
import { Product } from '../src/models/Product.js';
import { Order } from '../src/models/Order.js';
import { VendorOrder } from '../src/models/VendorOrder.js';
import { VendorSettlement } from '../src/models/VendorSettlement.js';
import { VendorLedger } from '../src/models/VendorLedger.js';
import { PlatformLedger } from '../src/models/PlatformLedger.js';
import { Commission } from '../src/models/Commission.js';
import { Payment } from '../src/models/Payment.js';
import { ROLES } from '../src/constants/roles.js';

export async function runDatabaseIntegrityAudit() {
  console.log('================================================================');
  console.log('       FAIRKART DEEP DATABASE INTEGRITY & DATA AUDIT');
  console.log('================================================================\n');

  const findings = [];

  function logFinding(severity, module, message) {
    findings.push({ severity, module, message });
    console.log(`  [${severity}] [${module}] ${message}`);
  }

  // 1. NEGATIVE VALUES CHECK
  console.log('--- 1. Checking for Negative Financial & Inventory Values ---');
  const negativeWallets = await Wallet.find({ balance: { $lt: 0 } }).lean();
  if (negativeWallets.length > 0) {
    logFinding('CRITICAL', 'Wallet', `Found ${negativeWallets.length} wallets with negative balance`);
  } else {
    console.log('  [PASS] Zero wallets with negative balance');
  }

  const negativeVendors = await Vendor.find({ balance: { $lt: 0 } }).lean();
  if (negativeVendors.length > 0) {
    logFinding('CRITICAL', 'Vendor', `Found ${negativeVendors.length} vendors with negative balance`);
  } else {
    console.log('  [PASS] Zero vendors with negative balance');
  }

  const negativeStocks = await Product.find({ stock: { $lt: 0 } }).lean();
  if (negativeStocks.length > 0) {
    logFinding('CRITICAL', 'Product', `Found ${negativeStocks.length} products with negative stock`);
  } else {
    console.log('  [PASS] Zero products with negative stock');
  }

  const negativeWalletTxs = await WalletTransaction.find({ amount: { $lt: 0 } }).lean();
  if (negativeWalletTxs.length > 0) {
    logFinding('CRITICAL', 'WalletTransaction', `Found ${negativeWalletTxs.length} wallet transactions with negative amount`);
  } else {
    console.log('  [PASS] Zero wallet transactions with negative amount');
  }

  // 2. ORPHAN RECORDS & BROKEN FOREIGN KEYS
  console.log('\n--- 2. Checking for Broken Foreign Key References & Orphan Records ---');
  // Check Orders pointing to non-existent Users
  const orders = await Order.find().select('userId orderNumber').lean();
  let orphanOrderCount = 0;
  for (const o of orders) {
    const u = await User.findById(o.userId).select('_id').lean();
    if (!u) orphanOrderCount++;
  }
  if (orphanOrderCount > 0) {
    logFinding('HIGH', 'Order', `Found ${orphanOrderCount} orders pointing to deleted or non-existent Users`);
  } else {
    console.log('  [PASS] All orders reference valid User documents');
  }

  // Check VendorOrders pointing to non-existent Orders or Vendors
  const vendorOrders = await VendorOrder.find().select('parentOrderId vendorId subOrderNumber').lean();
  let orphanVendorOrderCount = 0;
  for (const vo of vendorOrders) {
    const parent = await Order.findById(vo.parentOrderId).select('_id').lean();
    const vendor = await Vendor.findById(vo.vendorId).select('_id').lean();
    if (!parent || !vendor) orphanVendorOrderCount++;
  }
  if (orphanVendorOrderCount > 0) {
    logFinding('HIGH', 'VendorOrder', `Found ${orphanVendorOrderCount} vendor orders with missing parent Order or Vendor`);
  } else {
    console.log('  [PASS] All vendor orders reference valid parent Orders and Vendors');
  }

  // Check Settlements pointing to non-existent VendorOrders
  const settlements = await VendorSettlement.find().select('suborderId vendorId').lean();
  let orphanSettlements = 0;
  for (const s of settlements) {
    const vo = await VendorOrder.findById(s.suborderId).select('_id').lean();
    if (!vo) orphanSettlements++;
  }
  if (orphanSettlements > 0) {
    logFinding('HIGH', 'VendorSettlement', `Found ${orphanSettlements} settlements with missing VendorOrder`);
  } else {
    console.log('  [PASS] All settlements reference valid VendorOrder documents');
  }

  // 3. ENUM VALUES INTEGRITY
  console.log('\n--- 3. Checking Enum Values Integrity ---');
  const validRoles = Object.values(ROLES);
  const invalidRoleUsers = await User.find({ role: { $nin: validRoles } }).lean();
  if (invalidRoleUsers.length > 0) {
    logFinding('MEDIUM', 'User', `Found ${invalidRoleUsers.length} users with non-standard roles: ${invalidRoleUsers.map(u => u.role).join(', ')}`);
  } else {
    console.log(`  [PASS] All ${await User.countDocuments()} users hold valid system roles (${validRoles.join(', ')})`);
  }

  const validOrderStatuses = [
    'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'READY_TO_SHIP',
    'SHIPMENT_CREATED', 'PICKUP_REQUESTED', 'PICKUP_SCHEDULED', 'PICKED_UP',
    'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED',
    'RETURN_REQUESTED', 'RETURN_IN_TRANSIT', 'RETURNED', 'REFUNDED'
  ];
  const invalidOrderStatuses = await Order.find({ orderStatus: { $nin: validOrderStatuses } }).lean();
  if (invalidOrderStatuses.length > 0) {
    logFinding('HIGH', 'Order', `Found ${invalidOrderStatuses.length} orders with invalid orderStatus`);
  } else {
    console.log('  [PASS] All orders have valid orderStatus values');
  }

  // 4. DUPLICATE FIELD AUDIT
  console.log('\n--- 4. Checking Unique Keys & Duplication ---');
  const duplicateEmails = await User.aggregate([
    { $group: { _id: '$email', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 }, _id: { $ne: null } } }
  ]);
  if (duplicateEmails.length > 0) {
    logFinding('CRITICAL', 'User', `Found duplicate user emails: ${JSON.stringify(duplicateEmails)}`);
  } else {
    console.log('  [PASS] Zero duplicate user emails in database');
  }

  const duplicateOrderNumbers = await Order.aggregate([
    { $group: { _id: '$orderNumber', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 }, _id: { $ne: null } } }
  ]);
  if (duplicateOrderNumbers.length > 0) {
    logFinding('CRITICAL', 'Order', `Found duplicate order numbers: ${JSON.stringify(duplicateOrderNumbers)}`);
  } else {
    console.log('  [PASS] Zero duplicate order numbers in database');
  }

  // 5. INDEX SYNCHRONIZATION SUMMARY
  console.log('\n--- 5. Checking Model Indexes in MongoDB ---');
  const models = [User, Vendor, Product, Order, VendorOrder, Wallet, WalletTransaction, PlatformLedger, VendorLedger, Commission];
  for (const m of models) {
    const indexes = await m.collection.indexes();
    console.log(`  Model ${m.modelName}: ${indexes.length} active indexes in MongoDB`);
  }

  console.log('\n================================================================');
  console.log(`  DATABASE INTEGRITY AUDIT COMPLETE: ${findings.length === 0 ? 'CLEAN (PASS)' : `${findings.length} FINDINGS DETECTED`}`);
  console.log('================================================================\n');

  return findings;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  connectDB().then(async () => {
    try {
      await runDatabaseIntegrityAudit();
    } catch (e) {
      console.error('Database integrity audit fatal error:', e);
    } finally {
      await mongoose.disconnect();
      process.exit(0);
    }
  });
}
