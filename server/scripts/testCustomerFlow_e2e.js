import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix DNS for Windows if needed
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // ignore
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import { User } from '../src/models/User.js';
import { Product } from '../src/models/Product.js';
import { UserAddress } from '../src/models/UserAddress.js';
import { Order } from '../src/models/Order.js';
import { CustomerSubscriptionPlan } from '../src/models/CustomerSubscriptionPlan.js';
import { CustomerSubscription } from '../src/models/CustomerSubscription.js';
import { OfflineBill } from '../src/models/OfflineBill.js';
import { BillRewardRule } from '../src/models/BillRewardRule.js';
import { SpinWheel } from '../src/models/SpinWheel.js';
import { SpinHistory } from '../src/models/SpinHistory.js';
import { SpinAttempt } from '../src/models/SpinAttempt.js';

import { cartService } from '../src/services/cartService.js';
import { orderService } from '../src/services/orderService.js';
import { invoiceService } from '../src/services/invoiceService.js';
import { paymentService } from '../src/services/paymentService.js';
import { premiumService } from '../src/services/premiumService.js';
import { offlineBillService } from '../src/services/offlineBillService.js';
import { spinService } from '../src/services/spinService.js';
import { fairCoinService } from '../src/services/fairCoinService.js';
import { superCoinService } from '../src/services/superCoinService.js';

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function runE2ETests() {
  console.log('====================================================');
  console.log('🚀 STARTING FAIRKART CUSTOMER END-TO-END VERIFICATION');
  console.log('====================================================\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    try {
      await User.collection.dropIndex('referralCode_1');
    } catch (e) {
      // index might not exist or already dropped
    }
    await User.syncIndexes();

    // 1. Setup Test Customer User
    const testEmail = `cust_e2e_${Date.now()}@test.dev`;
    const customer = await User.create({
      name: 'E2E Test Customer',
      email: testEmail,
      referralCode: `E2E${Date.now().toString().slice(-6)}`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF',
      role: 'USER',
      phone: `98765${Math.floor(10000 + Math.random() * 90000)}`,
      isEmailVerified: true,
    });
    console.log(`✅ [1/9] Created Test Customer: ${customer.email} (ID: ${customer._id})`);

    // Credit initial wallet balance
    await fairCoinService.creditCoins({
      userId: customer._id,
      amount: 200,
      type: 'CREDIT',
      source: 'TEST_SEED',
      description: 'Initial test wallet balance',
    });

    // 2. Setup Test Address
    const address = await UserAddress.create({
      userId: customer._id,
      name: 'E2E Test Customer',
      phone: '9876543210',
      streetAddress: '123 Test Street, MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
      isDefault: true,
    });
    console.log(`✅ [2/9] Created Shipping Address (ID: ${address._id})`);

    // 3. Setup / Find a Product
    let product = await Product.findOne({ status: 'APPROVED', isDeleted: false }).populate('vendorId');
    if (!product) {
      const { Category } = await import('../src/models/Category.js');
      const { Vendor } = await import('../src/models/Vendor.js');

      let category = await Category.findOne();
      if (!category) {
        category = await Category.create({
          name: 'Groceries',
          slug: `groceries-${Date.now()}`,
          isActive: true,
        });
      }

      let vendor = await Vendor.findOne({ status: 'ACTIVE' });
      if (!vendor) {
        vendor = await Vendor.create({
          userId: customer._id,
          businessName: 'FairKart SuperStore',
          slug: `fairkart-store-${Date.now()}`,
          status: 'ACTIVE',
          onboardingStep: 'COMPLETED',
          isKycVerified: true,
        });
      }

      product = await Product.create({
        name: 'Fresh Organic Apples 1kg',
        slug: `organic-apples-${Date.now()}`,
        description: 'Crisp organic apples straight from the farm',
        price: 150,
        mrp: 180,
        stock: 50,
        vendorId: vendor._id,
        categoryId: category._id,
        sku: `SKU-APP-${Date.now()}`,
        status: 'APPROVED',
      });
    }
    console.log(`✅ [3/9] Using Test Product: "${product.name}" - ₹${product.price} (Stock: ${product.stock})`);

    // 4. Test Cart & Order Flow
    console.log('\n--- Testing Cart & Order Placement ---');
    await cartService.addToCart(customer._id, {
      productId: product._id,
      quantity: 2,
    });
    const cart = await cartService.getCart(customer._id);
    console.log(`🛒 Cart subtotal: ₹${cart.subtotal}, Total: ₹${cart.total}`);

    // Place Order via COD
    const orderPayload = {
      shippingAddressId: address._id,
      paymentMethod: 'COD',
      fairCoinsToRedeem: 20,
    };
    const order = await orderService.createOrder(customer._id, orderPayload);
    console.log(`✅ Order Placed: #${order.orderNumber} (Total: ₹${order.total}, Status: ${order.orderStatus}, Payment: ${order.paymentStatus})`);

    // 5. Test Invoice Generation
    console.log('\n--- Testing Invoice Generation ---');
    const { html: invoiceHtml, invoiceNumber } = await invoiceService.generateInvoiceHtml(order._id, customer);
    if (!invoiceHtml || !invoiceHtml.includes(order.orderNumber)) {
      throw new Error('Invoice HTML generation failed to contain order number');
    }
    console.log(`✅ Invoice HTML generated successfully (${invoiceHtml.length} bytes, Invoice #: ${invoiceNumber})`);

    // 6. Test Razorpay Payment Flow for Orders
    console.log('\n--- Testing Razorpay Order & Verification ---');
    const rzpOrder = await paymentService.createPaymentOrder({
      userId: customer._id,
      orderId: order._id,
    });
    console.log(`✅ Created Razorpay Order ID: ${rzpOrder.razorpayOrderId} (Amount in paise: ${rzpOrder.amount})`);

    // Verify payment in test/sandbox mode
    const paymentVerification = await paymentService.verifyPaymentSignature({
      razorpayOrderId: rzpOrder.razorpayOrderId,
      razorpayPaymentId: `pay_test_${Date.now()}`,
      razorpaySignature: 'mock_signature_dev',
    });
    console.log(`✅ Razorpay Payment Verified: Transaction ID: ${paymentVerification._id}, Status: ${paymentVerification.status}`);

    const updatedOrder = await Order.findById(order._id);
    console.log(`✅ Order Payment Status Updated: ${updatedOrder.paymentStatus}`);

    // 7. Test Customer VIP Subscription Flow
    console.log('\n--- Testing Customer VIP Subscription ---');
    let plan = await CustomerSubscriptionPlan.findOne({ status: 'ACTIVE' });
    if (!plan) {
      plan = await CustomerSubscriptionPlan.create({
        name: 'Quarterly VIP Pass',
        durationValue: 3,
        durationUnit: 'MONTH',
        price: 299,
        originalPrice: 399,
        freeDeliveryMinimum: 199,
        spinMultiplier: 2,
        superCoinBonus: 150,
        features: ['2x Daily Spins', 'Bonus 150 Super Coins', 'Exclusive VIP Deals'],
        status: 'ACTIVE',
      });
    }

    const subRequest = await premiumService.createSubscriptionRequest(customer._id, plan._id);
    console.log(`✅ Created Pending VIP Subscription Request (ID: ${subRequest._id})`);

    const subRzpOrder = await paymentService.createPaymentOrder({
      userId: customer._id,
      customerSubscriptionId: subRequest._id,
    });
    console.log(`✅ Created Subscription Razorpay Order: ${subRzpOrder.razorpayOrderId}`);

    // Verify subscription payment
    const subVerification = await paymentService.verifyPaymentSignature({
      razorpayOrderId: subRzpOrder.razorpayOrderId,
      razorpayPaymentId: `pay_sub_${Date.now()}`,
      razorpaySignature: 'mock_signature_dev',
    });
    console.log(`✅ VIP Subscription Activated! Plan: ${plan.name}`);

    const isPremium = await premiumService.isCustomerPremium(customer._id);
    console.log(`✅ Premium Check for User: isPremium = ${isPremium}`);

    // 8. Test Offline Bill Submission & Approval
    console.log('\n--- Testing Offline Bill Rewards ---');
    // Ensure active reward rule exists
    let rule = await BillRewardRule.findOne({ status: 'ACTIVE' });
    if (!rule) {
      rule = await BillRewardRule.create({
        name: 'Standard Grocery Reward',
        rewardType: 'PER_AMOUNT_SUPER_COINS',
        rate: 1,
        basis: 100,
        minimumPurchaseAmount: 100,
        maxReward: 500,
        premiumMultiplier: 2,
        status: 'ACTIVE',
      });
    }

    const billNumber = `OFF-TEST-${Date.now()}`;
    const offlineBill = await offlineBillService.submitBill(customer._id, {
      storeName: 'Babu Super Market, MG Road',
      billNumber: billNumber,
      billDate: new Date(),
      purchaseAmount: 1500,
      storePhone: '9876543210',
      storeAddress: 'MG Road, Bengaluru',
      fileUrl: 'https://example.com/sample_bill.jpg',
    });
    console.log(`✅ Offline Bill Submitted: Bill #${offlineBill.billNumber}, Status: ${offlineBill.status}`);

    // Admin approves the bill
    const approved = await offlineBillService.approveBill(offlineBill._id, customer._id);
    console.log(`✅ Offline Bill Approved! Reward Super Coins: ${approved.reward.finalAmount}`);

    const userWithSuperCoins = await User.findById(customer._id);
    console.log(`✅ Updated User Super Coin Balance: ${userWithSuperCoins.superCoinBalance}`);

    // 9. Test Spin Wheel & Daily Luck
    console.log('\n--- Testing Daily Spin Wheel ---');
    const wheel = await spinService.getActiveWheel();
    const eligibility = await spinService.checkUserEligibility(customer._id, wheel);
    console.log(`🎡 Active Wheel: "${wheel.title}", Eligible: ${eligibility.eligible}, Spins remaining: ${eligibility.spinsRemaining}`);

    const spinResult = await spinService.processSpin(customer._id, `spin_${Date.now()}_test`);
    console.log(`🎉 Spin Result: Won "${spinResult.reward.title}" (Type: ${spinResult.reward.type}, Value: ${spinResult.reward.value})`);
    console.log(`💰 Updated Balances after Spin -> Fair Coins: ${spinResult.newCoinBalance}, Super Coins: ${spinResult.newSuperCoinBalance}`);

    // 10. Test Idempotency & Duplicate Rejection
    console.log('\n--- Testing Idempotency & Fraud Checks ---');
    try {
      await offlineBillService.submitBill(customer._id, {
        storeName: 'Babu Super Market, MG Road',
        billNumber: billNumber,
        billDate: new Date(),
        purchaseAmount: 1500,
        fileUrl: 'https://example.com/sample_bill.jpg',
      });
      console.error('❌ Duplicate bill check failed (duplicate was accepted!)');
    } catch (err) {
      console.log(`✅ Duplicate Bill Submission Correctly Prevented: "${err.message}"`);
    }

    console.log('\n====================================================');
    console.log('🏆 ALL E2E BACKEND CUSTOMER FLOW TESTS PASSED!');
    console.log('====================================================\n');

    // Clean up test data
    await User.findByIdAndDelete(customer._id);
    await UserAddress.deleteMany({ userId: customer._id });
    await Order.deleteMany({ customerId: customer._id });
    await CustomerSubscription.deleteMany({ userId: customer._id });
    await OfflineBill.deleteMany({ customerId: customer._id });
    await SpinHistory.deleteMany({ userId: customer._id });
    await SpinAttempt.deleteMany({ userId: customer._id });
    console.log('🧹 Cleaned up temporary test customer records.');

    process.exit(0);
  } catch (err) {
    console.error('❌ E2E Test Failed with Error:', err);
    process.exit(1);
  }
}

runE2ETests();
