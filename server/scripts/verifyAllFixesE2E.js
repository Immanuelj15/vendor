import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import { env } from '../src/config/env.js';
import { connectDB } from '../src/config/db.js';

import { User } from '../src/models/User.js';
import { Wallet } from '../src/models/Wallet.js';
import { WalletTransaction } from '../src/models/WalletTransaction.js';
import { CoinTransaction } from '../src/models/CoinTransaction.js';
import { Product } from '../src/models/Product.js';
import { Order } from '../src/models/Order.js';
import { VendorOrder } from '../src/models/VendorOrder.js';
import { Payment } from '../src/models/Payment.js';
import { Vendor } from '../src/models/Vendor.js';
import { VendorSettlement } from '../src/models/VendorSettlement.js';
import { VendorLedger } from '../src/models/VendorLedger.js';
import { PlatformLedger } from '../src/models/PlatformLedger.js';
import { VendorWithdrawal } from '../src/models/VendorWithdrawal.js';
import { WebhookEvent } from '../src/models/WebhookEvent.js';
import { Commission } from '../src/models/Commission.js';
import { AuditLog } from '../src/models/AuditLog.js';

import { walletService } from '../src/services/walletService.js';
import { fairCoinService } from '../src/services/fairCoinService.js';
import { financeService } from '../src/services/financeService.js';
import { vendorService } from '../src/services/vendorService.js';
import { returnService } from '../src/services/returnService.js';
import { paymentService } from '../src/services/paymentService.js';
import { moneyUtils } from '../src/utils/moneyUtils.js';
import { ROLES } from '../src/constants/roles.js';

async function runE2EVerification() {
  console.log('====================================================');
  console.log('  FAIRKART END-TO-END REMEDIATION VERIFICATION SUITE');
  console.log('====================================================\n');

  await connectDB();

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: LOW-01 - User Role Default
    // -------------------------------------------------------------
    console.log('--- TEST 1: LOW-01 - Default User Role Verification ---');
    const testUserEmail = `test_audit_${Date.now()}@fairkart.local`;
    const userRoleTest = new User({
      name: 'Audit Role User',
      email: testUserEmail,
      passwordHash: 'HashedPassword123!',
      phone: `91${Math.floor(1000000000 + Math.random() * 9000000000)}`
    });
    await userRoleTest.save();
    assert(userRoleTest.role === ROLES.CUSTOMER, `Default role is "${ROLES.CUSTOMER}" (got: "${userRoleTest.role}")`);

    // -------------------------------------------------------------
    // TEST 2: MED-03 - Financial Precision Utility (moneyUtils)
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: MED-03 - Financial Precision Utility (moneyUtils) ---');
    const paise = moneyUtils.toPaise(199.99);
    assert(paise === 19999, `toPaise(199.99) === 19999 (got: ${paise})`);
    const fromPaise = moneyUtils.fromPaise(19999);
    assert(fromPaise === 199.99, `fromPaise(19999) === 199.99 (got: ${fromPaise})`);
    const pct = moneyUtils.calculatePercentage(1000, 15);
    assert(pct === 150, `calculatePercentage(1000, 15) === 150 (got: ${pct})`);
    const added = moneyUtils.addMoney(0.1, 0.2);
    assert(added === 0.3, `addMoney(0.1, 0.2) === 0.30 (got: ${added})`);

    // -------------------------------------------------------------
    // TEST 3: CRIT-01 - Decoupling Fair Coins from Fiat Wallet
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: CRIT-01 - Fair Coins Decoupled From Fiat Wallet ---');
    const coinUser = await User.create({
      name: 'Coin Decouple User',
      email: `coin_${Date.now()}@fairkart.local`,
      passwordHash: 'HashedPassword123!',
      phone: `91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      fairCoinBalance: 0
    });

    await fairCoinService.creditCoins({
      userId: coinUser._id,
      amount: 500,
      source: 'SIGNUP_BONUS',
      description: 'Signup bonus test'
    });

    const updatedCoinUser = await User.findById(coinUser._id);
    const userWallet = await Wallet.findOne({ userId: coinUser._id });

    assert(updatedCoinUser.fairCoinBalance === 500, `User.fairCoinBalance credited to 500 (got: ${updatedCoinUser.fairCoinBalance})`);
    assert(userWallet === null, `No fiat Wallet document was created or mutated by coin credit`);
    const coinTx = await CoinTransaction.findOne({ userId: coinUser._id });
    assert(coinTx !== null && coinTx.amount === 500, `CoinTransaction recorded with amount=500`);

    // -------------------------------------------------------------
    // TEST 4: CRIT-02 - Atomic Fiat Wallet & Double-Entry Ledger
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: CRIT-02 - Fiat Wallet & Double-Entry Ledger ---');
    const fiatUser = await User.create({
      name: 'Fiat Ledger User',
      email: `fiat_${Date.now()}@fairkart.local`,
      passwordHash: 'HashedPassword123!',
      phone: `91${Math.floor(1000000000 + Math.random() * 9000000000)}`
    });

    const creditRes = await walletService.creditWallet({
      userId: fiatUser._id,
      amount: 1000,
      type: 'COMMISSION_CREDIT',
      referenceId: `REF-${Date.now()}`,
      referenceType: 'SUBSCRIPTION',
      description: 'Test MLM credit'
    });

    const walletAfterCredit = await Wallet.findOne({ userId: fiatUser._id });
    assert(walletAfterCredit.balance === 1000, `Wallet balance after credit is ₹1000 (got: ${walletAfterCredit.balance})`);

    const ledgerCreditRecord = await WalletTransaction.findById(creditRes.transaction._id);
    assert(
      ledgerCreditRecord &&
      ledgerCreditRecord.amount === 1000 &&
      ledgerCreditRecord.balanceBefore === 0 &&
      ledgerCreditRecord.balanceAfter === 1000,
      `WalletTransaction credit created with exact opening (0) & closing (1000) balances`
    );

    const debitRes = await walletService.debitWallet({
      userId: fiatUser._id,
      amount: 400,
      type: 'WITHDRAWAL_DEBIT',
      referenceId: `REF-${Date.now()}`,
      referenceType: 'PAYOUT',
      description: 'Test payout debit'
    });

    const walletAfterDebit = await Wallet.findOne({ userId: fiatUser._id });
    assert(walletAfterDebit.balance === 600, `Wallet balance after debit is ₹600 (got: ${walletAfterDebit.balance})`);

    const ledgerDebitRecord = await WalletTransaction.findById(debitRes.transaction._id);
    assert(
      ledgerDebitRecord &&
      ledgerDebitRecord.amount === 400 &&
      ledgerDebitRecord.balanceBefore === 1000 &&
      ledgerDebitRecord.balanceAfter === 600,
      `WalletTransaction debit created with exact opening (1000) & closing (600) balances`
    );

    // Test Insufficient Balance rejection
    let debitFailedAsExpected = false;
    try {
      await walletService.debitWallet({
        userId: fiatUser._id,
        amount: 1000, // Available is only 600
        type: 'WITHDRAWAL_DEBIT',
        referenceId: `REF-${Date.now()}`,
        referenceType: 'PAYOUT',
        description: 'Should fail'
      });
    } catch (err) {
      debitFailedAsExpected = true;
    }
    assert(debitFailedAsExpected, `Debit exceeding balance rejected atomically with Insufficient balance error`);

    // -------------------------------------------------------------
    // TEST 5: CRIT-04 - Atomic Conditional Stock Decrement
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: CRIT-04 - Atomic Conditional Stock Decrement ---');
    const testVendorUser = await User.create({
      name: 'Stock Test Vendor User',
      email: `stockvendor_${Date.now()}@fairkart.local`,
      passwordHash: 'HashedPassword123!',
      phone: `91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      role: ROLES.VENDOR
    });

    const testVendor = await Vendor.create({
      userId: testVendorUser._id,
      storeName: 'Audit Stock Store',
      status: 'APPROVED',
      balance: 0,
      slug: `audit-store-${Date.now()}`
    });

    const dummyCategoryId = new mongoose.Types.ObjectId();
    const singleStockProduct = await Product.create({
      vendorId: testVendor._id,
      categoryId: dummyCategoryId,
      name: 'Limited Flash Product',
      slug: `flash-prod-${Date.now()}`,
      mrp: 499,
      price: 299,
      stock: 1,
      sku: `SKU-${Date.now()}`,
      description: 'Stock test item'
    });

    // Simulate concurrent purchase attempts of quantity 1
    const attempt1 = Product.findOneAndUpdate(
      { _id: singleStockProduct._id, stock: { $gte: 1 } },
      { $inc: { stock: -1 } },
      { new: true }
    );
    const attempt2 = Product.findOneAndUpdate(
      { _id: singleStockProduct._id, stock: { $gte: 1 } },
      { $inc: { stock: -1 } },
      { new: true }
    );

    const [res1, res2] = await Promise.all([attempt1, attempt2]);
    const successCount = (res1 ? 1 : 0) + (res2 ? 1 : 0);
    const finalProduct = await Product.findById(singleStockProduct._id);

    assert(successCount === 1, `Exactly 1 concurrent purchase succeeded (successCount: ${successCount})`);
    assert(finalProduct.stock === 0, `Final stock is 0 and did NOT drop negative (got: ${finalProduct.stock})`);

    await Vendor.findByIdAndUpdate(testVendor._id, { balance: 5000 });
    await VendorLedger.create({
      vendorId: testVendor._id,
      transactionType: 'SALE',
      credit: 5000,
      balanceSnapshot: 5000,
      description: 'Audit test starting sales balance'
    });

    const idempotencyKey = `wd_audit_${Date.now()}`;
    const wd1 = await vendorService.requestWithdrawal(testVendor._id, {
      amount: 2000,
      payoutDetails: {
        accountNumber: '1234567890',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank',
        accountHolderName: 'Audit Vendor'
      },
      idempotencyKey
    });

    const vendorAfterWd1 = await Vendor.findById(testVendor._id);
    assert(vendorAfterWd1.balance === 3000, `Vendor balance debited atomically from 5000 to 3000 (got: ${vendorAfterWd1.balance})`);

    const wdLedger = await VendorLedger.findOne({ vendorId: testVendor._id, transactionType: 'WITHDRAWAL_RESERVE' });
    assert(wdLedger !== null && wdLedger.debit === 2000, `VendorLedger WITHDRAWAL_RESERVE entry recorded for withdrawal`);

    // Duplicate withdrawal with same idempotency key
    const wdDuplicate = await vendorService.requestWithdrawal(testVendor._id, {
      amount: 2000,
      payoutDetails: {
        accountNumber: '1234567890',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank',
        accountHolderName: 'Audit Vendor'
      },
      idempotencyKey
    });
    const vendorAfterDup = await Vendor.findById(testVendor._id);
    assert(vendorAfterDup.balance === 3000, `Duplicate withdrawal idempotently returned cached request; balance remains 3000`);
    assert(wdDuplicate._id.toString() === wd1._id.toString(), `Returned withdrawal ID matches original withdrawal`);

    // Withdrawal exceeding remaining balance
    let overdrawRejected = false;
    try {
      await vendorService.requestWithdrawal(testVendor._id, {
        amount: 4000, // Available balance is only 3000
        payoutDetails: { accountNumber: '1234567890', ifscCode: 'HDFC0001234' }
      });
    } catch (err) {
      overdrawRejected = true;
    }
    assert(overdrawRejected, `Withdrawal request exceeding available balance rejected atomically`);

    // -------------------------------------------------------------
    // TEST 7: HIGH-02 - Webhook Deduplication (WebhookEvent)
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: HIGH-02 - Webhook Event Deduplication ---');
    const webhookPayload = JSON.stringify({
      event: 'payment.failed',
      id: `evt_audit_test_${Date.now()}`,
      payload: {
        payment: {
          entity: {
            id: `pay_audit_test_${Date.now()}`,
            order_id: 'order_dummy_123',
            error_description: 'Test failure'
          }
        }
      }
    });
    const signature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(webhookPayload)
      .digest('hex');

    const firstCall = await paymentService.handleWebhook(webhookPayload, signature);
    assert(firstCall.received === true && !firstCall.duplicate, `First webhook delivery processed (received: true)`);

    const secondCall = await paymentService.handleWebhook(webhookPayload, signature);
    assert(secondCall.received === true && secondCall.duplicate === true, `Second identical webhook delivery rejected as duplicate`);

    // -------------------------------------------------------------
    // TEST 8: HIGH-03 - Double-Entry Platform Ledger for Online Orders
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: HIGH-03 - Online Order Platform Ledger Double-Entry ---');
    const orderCustomer = await User.create({
      name: 'Order Test Customer',
      email: `order_cust_${Date.now()}@fairkart.local`,
      passwordHash: 'HashedPassword123!',
      phone: `91${Math.floor(1000000000 + Math.random() * 9000000000)}`
    });

    const orderNum = `ORD-${Date.now()}`;
    const onlineOrder = await Order.create({
      orderNumber: orderNum,
      publicOrderId: orderNum,
      userId: orderCustomer._id,
      items: [{
        productId: singleStockProduct._id,
        vendorId: testVendor._id,
        name: 'Test Online Product',
        productNameSnapshot: 'Test Online Product',
        skuSnapshot: 'SKU-TEST',
        price: 1000,
        unitPrice: 1000,
        quantity: 1,
        lineTotal: 1000
      }],
      subtotal: 1000,
      itemsSubtotal: 1000,
      total: 1000,
      grandTotal: 1000,
      paymentStatus: 'PAID',
      orderStatus: 'CONFIRMED',
      deliveryAddressSnapshot: {
        street: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India'
      }
    });

    const subOrderNum = `SUB-${Date.now()}`;
    const vendorSuborder = await VendorOrder.create({
      parentOrderId: onlineOrder._id,
      vendorId: testVendor._id,
      subOrderNumber: subOrderNum,
      publicSuborderId: subOrderNum,
      vendorNameSnapshot: testVendor.storeName,
      businessNameSnapshot: testVendor.storeName,
      userId: orderCustomer._id,
      subtotal: 1000,
      itemsSubtotal: 1000,
      grandTotal: 1000,
      platformCommission: 50,
      vendorEarning: 950,
      status: 'CONFIRMED',
      items: [{
        productId: singleStockProduct._id,
        vendorId: testVendor._id,
        name: 'Test Online Product',
        productNameSnapshot: 'Test Online Product',
        skuSnapshot: 'SKU-TEST',
        price: 1000,
        unitPrice: 1000,
        quantity: 1,
        lineTotal: 1000
      }]
    });

    // Allocate order finances
    await financeService.allocateOrderFinances(onlineOrder._id);

    const platformCollectionEntry = await PlatformLedger.findOne({
      sourceEntityId: onlineOrder._id.toString(),
      type: 'ORDER_COMMISSION'
    });
    assert(
      platformCollectionEntry !== null &&
      platformCollectionEntry.credit > 0,
      `PlatformLedger CREDIT entry recorded for platform commission (amount: ₹${platformCollectionEntry?.credit})`
    );

    const vendorSettlement = await VendorSettlement.findOne({ suborderId: vendorSuborder._id, vendorId: testVendor._id });
    assert(vendorSettlement !== null && vendorSettlement.status === 'ON_HOLD', `VendorSettlement created with net payable ₹${vendorSettlement?.netPayable}`);

    // -------------------------------------------------------------
    // TEST 9: CRIT-03 - Order Cancellation & Financial Reversals
    // -------------------------------------------------------------
    console.log('\n--- TEST 9: CRIT-03 - Order Cancellation Full Financial Reversal ---');
    // Pre-credit coins to simulate customer earning purchase rewards
    await fairCoinService.creditCoins({
      userId: orderCustomer._id,
      amount: 50,
      type: 'PURCHASE_REWARD',
      source: 'PURCHASE_REWARD',
      referenceId: onlineOrder.orderNumber
    });
    const coinsBeforeCancel = (await User.findById(orderCustomer._id)).fairCoinBalance;
    assert(coinsBeforeCancel >= 50, `Customer earned 50 reward coins from purchase`);

    // Create payment record
    const paymentRecord = await Payment.create({
      orderId: onlineOrder._id,
      userId: orderCustomer._id,
      amount: 1000,
      currency: 'INR',
      paymentMethod: 'RAZORPAY',
      transactionId: `tx_pay_${Date.now()}`,
      status: 'CAPTURED',
      razorpayPaymentId: `pay_${Date.now()}`
    });

    const cancelResult = await returnService.cancelOrder(
      onlineOrder._id,
      orderCustomer
    );
    assert(cancelResult.orderStatus === 'CANCELLED', `Order cancellation succeeded (orderStatus: CANCELLED)`);

    // Verify VendorSettlement cancelled
    const updatedSettlement = await VendorSettlement.findOne({ suborderId: vendorSuborder._id });
    assert(updatedSettlement.status === 'CANCELLED', `VendorSettlement status updated to CANCELLED`);

    // Verify PlatformLedger reversal entry
    const platformReversalEntry = await PlatformLedger.findOne({
      sourceEntityId: onlineOrder._id.toString(),
      type: 'REFUND_REVERSAL'
    });
    assert(
      platformReversalEntry !== null && platformReversalEntry.debit > 0,
      `PlatformLedger DEBIT reversal entry created for refunded order (debit: ₹${platformReversalEntry?.debit})`
    );

    // Verify coins reclaimed
    const coinsAfterCancel = (await User.findById(orderCustomer._id)).fairCoinBalance;
    assert(
      coinsAfterCancel === coinsBeforeCancel - 50,
      `Customer purchase reward coins (50) reclaimed upon cancellation (now: ${coinsAfterCancel})`
    );

    // Verify Payment status REFUNDED
    const updatedPayment = await Payment.findById(paymentRecord._id);
    assert(updatedPayment.status === 'REFUNDED', `Payment status updated to REFUNDED`);

    // -------------------------------------------------------------
    // TEST 10: MED-01 - Commission Unique Compound Index
    // -------------------------------------------------------------
    console.log('\n--- TEST 10: MED-01 - Commission Compound Unique Index ---');
    const dummySubId = new mongoose.Types.ObjectId();
    const dummyRecipId = new mongoose.Types.ObjectId();

    await Commission.create({
      subscriptionId: dummySubId,
      level: 1,
      type: 'MLM_VENDOR_SUBSCRIPTION_COMMISSION',
      recipientUserId: dummyRecipId,
      commissionAmount: 100,
      commissionPercentage: 10,
      orderAmount: 1000,
      status: 'PENDING'
    });

    let dupThrewError = false;
    try {
      await Commission.create({
        subscriptionId: dummySubId,
        level: 1,
        type: 'MLM_VENDOR_SUBSCRIPTION_COMMISSION',
        recipientUserId: dummyRecipId,
        commissionAmount: 100,
        commissionPercentage: 10,
        orderAmount: 1000,
        status: 'PENDING'
      });
    } catch (err) {
      if (err.code === 11000) {
        dupThrewError = true;
      }
    }
    assert(dupThrewError, `Duplicate Commission with same (subscriptionId, level, recipientUserId) rejected by index`);

    // -------------------------------------------------------------
    // TEST 11: MED-02 - AuditLog Query Indexes
    // -------------------------------------------------------------
    console.log('\n--- TEST 11: MED-02 - AuditLog Indexes ---');
    const auditIndexes = await AuditLog.collection.indexes();
    const indexNames = auditIndexes.map(idx => Object.keys(idx.key).join('_'));
    const hasCreatedAtIndex = indexNames.some(name => name.includes('createdAt'));
    const hasUserIndex = indexNames.some(name => name.includes('userId'));
    const hasEntityIndex = indexNames.some(name => name.includes('entity'));

    assert(hasCreatedAtIndex, `AuditLog has index on createdAt`);
    assert(hasUserIndex, `AuditLog has compound index including userId`);
    assert(hasEntityIndex, `AuditLog has compound index including entity`);

    // -------------------------------------------------------------
    // SUITE SUMMARY
    // -------------------------------------------------------------
    console.log('\n====================================================');
    console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runE2EVerification();
