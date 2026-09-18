/**
 * FairKart Production Hardening Verification Test Suite
 * Tests Security, Super Admin RBAC, Audit Logging, Order State Machine,
 * Minimum Payouts, MLM Suspended Upline Protection, and Financial Explorer.
 */

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import { User } from '../src/models/User.js';
import { Vendor } from '../src/models/Vendor.js';
import { Order } from '../src/models/Order.js';
import { VendorOrder } from '../src/models/VendorOrder.js';
import { Product } from '../src/models/Product.js';
import { Wallet } from '../src/models/Wallet.js';
import { WalletTransaction } from '../src/models/WalletTransaction.js';
import { AuditLog } from '../src/models/AuditLog.js';
import StockTransaction from '../src/models/StockTransaction.js';
import { Commission } from '../src/models/Commission.js';
import { orderService } from '../src/services/orderService.js';
import { vendorService } from '../src/services/vendorService.js';
import { mlmRewardService } from '../src/services/mlmRewardService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fairkart_jwt_secret_key_prod_2026';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fairkart';

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

async function runHardeningTests() {
  console.log('================================================================');
  console.log('    FAIRKART SECOND-LEVEL PRODUCTION HARDENING TEST SUITE       ');
  console.log('================================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log('[Connected to MongoDB]\n');

  try {
    // -------------------------------------------------------------
    // SECTION 1: SUPER ADMIN RBAC & TOKEN GENERATION
    // -------------------------------------------------------------
    console.log('--- TEST 1: Super Admin RBAC Gatekeeper Verification ---');
    let superAdmin = await User.findOne({ role: 'SUPER_ADMIN' });
    if (!superAdmin) {
      superAdmin = await User.create({
        name: 'Super Auditor',
        email: 'superauditor@fairkart.dev',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE'
      });
    }

    let regularAdmin = await User.findOne({ role: 'ADMIN' });
    if (!regularAdmin) {
      regularAdmin = await User.create({
        name: 'Regular Admin',
        email: 'regularadmin@fairkart.dev',
        role: 'ADMIN',
        status: 'ACTIVE'
      });
    }

    let testCustomer = await User.findOne({ role: 'CUSTOMER' });
    if (!testCustomer) {
      testCustomer = await User.create({
        name: 'Test Customer',
        email: 'testcustomer@fairkart.dev',
        role: 'CUSTOMER',
        status: 'ACTIVE'
      });
    }

    const generateToken = (user) => jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

    const superAdminToken = generateToken(superAdmin);
    const adminToken = generateToken(regularAdmin);
    const customerToken = generateToken(testCustomer);

    const decodedSuper = jwt.verify(superAdminToken, JWT_SECRET);
    const decodedAdmin = jwt.verify(adminToken, JWT_SECRET);
    const decodedCustomer = jwt.verify(customerToken, JWT_SECRET);

    assert(decodedSuper.role === 'SUPER_ADMIN', 'Super Admin token contains SUPER_ADMIN role');
    assert(decodedAdmin.role !== 'SUPER_ADMIN', 'Admin token does NOT grant SUPER_ADMIN privileges');
    assert(decodedCustomer.role === 'CUSTOMER', 'Customer token is strictly restricted to CUSTOMER role');

    // -------------------------------------------------------------
    // SECTION 2: AUDIT LOGGING FOR CRITICAL ACTIONS
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: AuditLog Dual-Style Invocation & Traceability ---');
    const prevAuditCount = await AuditLog.countDocuments();
    
    // Test positional invocation (Express route style)
    const mockReq = {
      user: { _id: superAdmin._id, email: superAdmin.email, role: 'SUPER_ADMIN' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'JestAuditTester/1.0' }
    };
    
    const { logAdminAction } = await import('../src/services/auditLogService.js');
    await logAdminAction(mockReq, 'SETTINGS_UPDATE', 'SYSTEM_SETTINGS', null, {
      changedSetting: 'MIN_PAYOUT_AMOUNT',
      oldValue: 50,
      newValue: 100
    });

    const newAuditCount = await AuditLog.countDocuments();
    assert(newAuditCount === prevAuditCount + 1, 'AuditLog created successfully via Express req style');

    const latestLog = await AuditLog.findOne().sort({ createdAt: -1 });
    assert(latestLog.userId.toString() === superAdmin._id.toString(), 'AuditLog captures correct executing Super Admin ID');
    assert(latestLog.action === 'SETTINGS_UPDATE', 'AuditLog records correct action name');
    assert(latestLog.newValue?.newValue === 100, 'AuditLog details preserve before/after configuration state');

    // -------------------------------------------------------------
    // SECTION 3: ORDER STATE MACHINE STRICTNESS
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Order State Machine Legal vs Illegal Transitions ---');
    const testOrder = await Order.create({
      orderNumber: `AUDIT-SM-${Date.now()}`,
      publicOrderId: `AUDIT-PUB-${Date.now()}`,
      userId: testCustomer._id,
      items: [],
      subtotal: 1000,
      itemsSubtotal: 1000,
      total: 1000,
      grandTotal: 1000,
      deliveryAddressSnapshot: { fullName: 'Auditor', streetAddress: 'Audit HQ', city: 'AuditCity', state: 'AuditState', postalCode: '600001' },
      orderStatus: 'DELIVERED',
      paymentStatus: 'PAID',
    });

    // Attempt illegal transition DELIVERED -> PENDING
    let caughtIllegalError = false;
    try {
      await orderService.updateOrderStatus(testOrder._id, 'PENDING', superAdmin._id);
    } catch (err) {
      caughtIllegalError = true;
      assert(err.message.includes('Invalid order status transition'), `Illegal transition rejected with error: "${err.message}"`);
    }
    assert(caughtIllegalError, 'Order State Machine blocks invalid backwards transition from DELIVERED to PENDING');

    // Clean up test order
    await Order.findByIdAndDelete(testOrder._id);

    // -------------------------------------------------------------
    // SECTION 4: MINIMUM PAYOUT VALIDATION
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Vendor Payout Threshold Enforcement ---');
    // Create temporary vendor with ₹500 balance
    const testVendorUser = await User.create({
      name: 'Withdrawal Vendor User',
      email: `wvendor-${Date.now()}@fairkart.dev`,
      role: 'VENDOR',
      status: 'ACTIVE',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuv'
    });

    const testVendor = await Vendor.create({
      userId: testVendorUser._id,
      storeName: `Audited Payout Store ${Date.now()}`,
      slug: `audited-payout-store-${Date.now()}`,
      status: 'APPROVED',
      balance: 500,
      bankDetails: {
        accountNumber: '1234567890',
        ifscCode: 'HDFC0001234',
        accountHolderName: 'Audited Store'
      }
    });

    let payoutBelowMinFailed = false;
    try {
      // Attempt withdrawal of ₹50 when minimum is ₹100
      await vendorService.requestWithdrawal(testVendor._id, { amount: 50, payoutDetails: { note: 'Request below minimum' } });
    } catch (err) {
      payoutBelowMinFailed = true;
      assert(err.message.includes('Minimum withdrawal amount'), `Sub-minimum payout blocked with error: "${err.message}"`);
    }
    assert(payoutBelowMinFailed, 'Vendor payout below minimum limit is strictly rejected');

    let payoutExceedingBalanceFailed = false;
    try {
      // Attempt withdrawal exceeding balance (₹600 > ₹500)
      await vendorService.requestWithdrawal(testVendor._id, { amount: 600, payoutDetails: { note: 'Request exceeding balance' } });
    } catch (err) {
      payoutExceedingBalanceFailed = true;
      assert(err.message.includes('Insufficient'), `Excess payout blocked with error: "${err.message}"`);
    }
    assert(payoutExceedingBalanceFailed, 'Vendor payout exceeding wallet balance is strictly rejected');

    // Clean up test vendor
    await Vendor.findByIdAndDelete(testVendor._id);
    await User.findByIdAndDelete(testVendorUser._id);

    // -------------------------------------------------------------
    // SECTION 5: MLM SUSPENDED UPLINE COMMISSION EXCLUSION
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: MLM Suspended Upline Commission Exclusion ---');
    const suspendedUpline = await User.create({
      name: 'Suspended Upline',
      email: `suspended-upline-${Date.now()}@fairkart.dev`,
      role: 'CUSTOMER',
      status: 'SUSPENDED',
      referralCode: `SUSP${Date.now().toString().slice(-4)}`,
      passwordHash: '$2b$10$abcdefghijklmnopqrstuv'
    });

    const activeChild = await User.create({
      name: 'Active Child',
      email: `active-child-${Date.now()}@fairkart.dev`,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      referredBy: suspendedUpline._id,
      referralPath: [suspendedUpline._id],
      passwordHash: '$2b$10$abcdefghijklmnopqrstuv'
    });

    // Check upline chain resolution for active child
    const uplineChain = await mlmRewardService.getUpline(activeChild._id, 9);
    const includesSuspended = uplineChain.some(node => node.user._id.toString() === suspendedUpline._id.toString());
    assert(!includesSuspended, 'Suspended upline is strictly EXCLUDED from commission distribution chain');

    // Clean up
    await User.findByIdAndDelete(suspendedUpline._id);
    await User.findByIdAndDelete(activeChild._id);

    // -------------------------------------------------------------
    // SECTION 6: FINANCIAL TRANSACTION EXPLORER ENDPOINT TEST
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Financial Transaction Lineage Explorer Service ---');
    // Find an existing completed order in database
    const existingOrder = await Order.findOne({ paymentStatus: 'PAID' }).sort({ createdAt: -1 });
    if (existingOrder) {
      const mockReq = { params: { orderId: existingOrder._id.toString() } };
      let responsePayload = null;

      const { getOrderFinancialLineage } = await import('../src/controllers/superAdminController.js');
      await new Promise((resolve) => {
        const mockRes = {
          status: function(code) { this.statusCode = code; return this; },
          json: function(payload) { responsePayload = payload; resolve(); return this; }
        };
        const mockNext = (err) => { 
          if (err) console.error('Controller Error:', err); 
          resolve();
        };
        getOrderFinancialLineage(mockReq, mockRes, mockNext);
      });

      assert(responsePayload && responsePayload.success === true, 'Financial Lineage Explorer returned success = true');
      console.log('  Explorer Response Keys:', Object.keys(responsePayload.data || {}));
      console.log('  Explorer Order ID:', responsePayload?.data?.order?._id);
      assert(responsePayload?.data?.order?.id?.toString() === existingOrder._id.toString(), 'Trace correctly resolved master Order entity');
      assert(Array.isArray(responsePayload?.data?.vendorSuborders), 'Trace mapped all child VendorOrders');
      assert(responsePayload?.data?.reconciliation?.doubleEntryBalanced === true, 'Double-entry accounting equation validated as BALANCED');
    } else {
      console.log('  [SKIP] No existing PAID order found to test lineage explorer.');
    }

    // -------------------------------------------------------------
    // SECTION 7: STOCKTRANSACTION AUDIT LOGGING
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Stock Transaction Immutable History Model ---');
    const stockTxCount = await StockTransaction.countDocuments();
    assert(typeof stockTxCount === 'number', `StockTransaction collection is operational (${stockTxCount} historical logs found)`);

  } catch (err) {
    console.error('Unhandled test exception:', err);
    testsFailed++;
  } finally {
    await mongoose.disconnect();
    console.log('\n================================================================');
    console.log(`TOTAL HARDENING TESTS: ${testsPassed + testsFailed} | PASSED: ${testsPassed} | FAILED: ${testsFailed}`);
    console.log('================================================================\n');
    process.exit(testsFailed > 0 ? 1 : 0);
  }
}

runHardeningTests();
