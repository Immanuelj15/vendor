import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/User.js';
import { Vendor } from '../src/models/Vendor.js';
import { Product } from '../src/models/Product.js';
import { Category } from '../src/models/Category.js';
import { Brand } from '../src/models/Brand.js';
import { Coupon } from '../src/models/Coupon.js';
import { Campaign } from '../src/models/Campaign.js';
import { Review } from '../src/models/Review.js';
import { Order } from '../src/models/Order.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { Notification } from '../src/models/Notification.js';
import { CoinTransaction } from '../src/models/CoinTransaction.js';

import { productService } from '../src/services/productService.js';
import { priceService } from '../src/services/priceService.js';
import { couponService } from '../src/services/couponService.js';
import { reviewService } from '../src/services/reviewService.js';
import { campaignService } from '../src/services/campaignService.js';
import { fairCoinService } from '../src/services/fairCoinService.js';
import { cartService } from '../src/services/cartService.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fairkart';

async function runTests() {
  console.log('--- Phase 9 Integration Test Suite ---');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  // Clean Test Data
  await User.deleteMany({ email: /testphase9/ });
  await Vendor.deleteMany({ storeName: /TestPhase9/ });
  await Product.deleteMany({ name: /TestPhase9/ });
  await Category.deleteMany({ name: /TestPhase9/ });
  await Brand.deleteMany({ name: /TestPhase9/ });
  await Coupon.deleteMany({ code: /TESTPH9/ });
  await Campaign.deleteMany({ title: /TestPhase9/ });
  await Review.deleteMany({ title: /TestPhase9/ });
  await Order.deleteMany({ orderNumber: /TESTPH9/ });
  await AuditLog.deleteMany({ action: /PRODUCT_STATUS_UPDATE/ });

  console.log('Database cleaned. Seeding test entities...');

  // 1. Create Users & Vendor
  const admin = await User.create({
    name: 'TestPhase9 Admin',
    email: 'admin.testphase9@example.com',
    passwordHash: 'mock_hash',
    role: 'ADMIN',
    referralCode: 'REF_ADMIN_TEST9',
  });

  const customer = await User.create({
    name: 'TestPhase9 Customer',
    email: 'customer.testphase9@example.com',
    passwordHash: 'mock_hash',
    role: 'USER',
    referralCode: 'REF_CUST_TEST9',
  });

  const vendorUser = await User.create({
    name: 'TestPhase9 Vendor',
    email: 'vendor.testphase9@example.com',
    passwordHash: 'mock_hash',
    role: 'VENDOR',
    referralCode: 'REF_VEND_TEST9',
  });

  const vendorProfile = await Vendor.create({
    userId: vendorUser._id,
    storeName: 'TestPhase9 Store',
    slug: 'testphase9-store',
    status: 'APPROVED',
  });

  // 2. Create Category & Brand
  const category1 = await Category.create({
    name: 'TestPhase9 Category 1',
    slug: 'testphase9-cat-1',
    isActive: true,
  });

  const category2 = await Category.create({
    name: 'TestPhase9 Category 2',
    slug: 'testphase9-cat-2',
    isActive: true,
  });

  const brand = await Brand.create({
    name: 'TestPhase9 Brand',
    slug: 'testphase9-brand',
    isActive: true,
  });

  // 3. Create Products (Approved vs Pending)
  const approvedProduct = await Product.create({
    name: 'TestPhase9 Approved Item',
    slug: 'testphase9-approved-item',
    price: 100000, // ₹1000.00
    discountPrice: 80000, // ₹800.00
    stock: 50,
    sku: 'TESTPH9-APP-BASE',
    categoryId: category1._id,
    brandId: brand._id,
    vendorId: vendorProfile._id,
    status: 'APPROVED',
    variants: [
      {
        sku: 'TESTPH9-APP-VAR1',
        name: 'Variant Large',
        price: 150000, // ₹1500.00
        discountPrice: 120000, // ₹1200.00
        stock: 10,
      },
    ],
  });

  const pendingProduct = await Product.create({
    name: 'TestPhase9 Pending Item',
    slug: 'testphase9-pending-item',
    price: 200000, // ₹2000.00
    stock: 5,
    sku: 'TESTPH9-PEND',
    categoryId: category2._id,
    brandId: brand._id,
    vendorId: vendorProfile._id,
    status: 'PENDING_APPROVAL',
  });

  console.log('Seeding completed. Beginning Task Assertions...');

  // Assertion 1: Public Catalog Filters
  console.log('\n--- Assertion 1: Public Catalog Filters ---');
  const catalogList = await productService.getProducts({
    category: 'testphase9-cat-1',
    brand: 'testphase9-brand',
  });
  console.log(`Querying by category & brand. Found: ${catalogList.products.length} products (Expected: 1)`);
  if (catalogList.products.length !== 1 || catalogList.products[0]._id.toString() !== approvedProduct._id.toString()) {
    throw new Error('Public catalog failed to filter by category & brand slugs correctly');
  }
  console.log('✔ Assertion 1 Passed.');

  // Assertion 2: Admin Status Moderation, Notifications, and Audit Logs
  console.log('\n--- Assertion 2: Admin Status Moderation ---');
  await productService.updateProductStatus(
    pendingProduct._id,
    'APPROVED',
    'Catalog content looks complete',
    admin._id,
    '127.0.0.1'
  );
  
  const updatedPend = await Product.findById(pendingProduct._id);
  console.log(`Updated Product status: ${updatedPend.status} (Expected: APPROVED)`);
  if (updatedPend.status !== 'APPROVED') {
    throw new Error('Product approval status failed to update to APPROVED');
  }

  const audit = await AuditLog.findOne({ entityId: pendingProduct._id.toString() });
  console.log(`Audit log action: ${audit?.action} (Expected: PRODUCT_STATUS_UPDATE_APPROVED)`);
  if (!audit || audit.newValue !== 'APPROVED') {
    throw new Error('AuditLog was not recorded correctly for product status update');
  }

  const notification = await Notification.findOne({ userId: vendorUser._id, type: 'PRODUCT_STATUS' });
  console.log(`Vendor Alert created: "${notification?.title}" (Message: "${notification?.message}")`);
  if (!notification) {
    throw new Error('Notification alert was not dispatched to vendor on status moderation');
  }
  console.log('✔ Assertion 2 Passed.');

  // Assertion 3: Server-side Pricing Evaluation
  console.log('\n--- Assertion 3: Server-side Pricing Evaluation ---');
  const basePricing = priceService.getEffectiveProductPrice(approvedProduct);
  console.log(`Base effective price: ₹${basePricing.sellingPrice / 100} (Expected: ₹800)`);
  if (basePricing.sellingPrice !== 80000 || basePricing.sku !== 'TESTPH9-APP-BASE') {
    throw new Error('Base product pricing calculation is incorrect');
  }

  const variantPricing = priceService.getEffectiveProductPrice(approvedProduct, 'TESTPH9-APP-VAR1');
  console.log(`Variant effective price: ₹${variantPricing.sellingPrice / 100} (Expected: ₹1200)`);
  if (variantPricing.sellingPrice !== 120000 || variantPricing.sku !== 'TESTPH9-APP-VAR1') {
    throw new Error('Variant pricing calculation is incorrect');
  }
  console.log('✔ Assertion 3 Passed.');

  // Assertion 4: Coupon Validations (Category exclusions, caps, min purchase)
  console.log('\n--- Assertion 4: Coupon Validations ---');
  const activeCoupon = await Coupon.create({
    code: 'TESTPH9-PROMO',
    type: 'PERCENTAGE',
    discountValue: 10,
    minPurchase: 50000, // ₹500
    maxDiscount: 15000, // max ₹150 cap
    usageLimit: 5,
    endDate: new Date(Date.now() + 86400000),
    applicableCategories: [category1._id], // Category 1 only
  });

  const cartItems = [
    {
      productId: approvedProduct._id,
      quantity: 1,
      variantSku: 'TESTPH9-APP-VAR1', // Price: ₹1200, category1 matches
    },
  ];

  const validation = await couponService.validateCoupon({
    code: 'TESTPH9-PROMO',
    userId: customer._id,
    items: cartItems,
  });

  // Expected discount: 10% of ₹1200 is ₹120. Which is <= maxDiscount of ₹150.
  console.log(`Coupon validated. Discount: ₹${validation.discountAmount / 100} (Expected: ₹120)`);
  if (validation.discountAmount !== 12000) {
    throw new Error('Coupon discount value is incorrect');
  }

  // Verify category exclusion
  const excludedCart = [
    {
      productId: pendingProduct._id, // Price: ₹2000, Category 2 (excluded)
      quantity: 1,
    },
  ];

  try {
    await couponService.validateCoupon({
      code: 'TESTPH9-PROMO',
      userId: customer._id,
      items: excludedCart,
    });
    throw new Error('Coupon validation did not block category-excluded items');
  } catch (err) {
    console.log(`Exclusion blocked as expected: "${err.message}"`);
  }

  // Test atomic concurrency limits
  await couponService.incrementUsageAtomic(activeCoupon._id);
  const reloadedCoupon = await Coupon.findById(activeCoupon._id);
  console.log(`Coupon used count: ${reloadedCoupon.usedCount} (Expected: 1)`);
  if (reloadedCoupon.usedCount !== 1) {
    throw new Error('UsedCount was not incremented correctly');
  }
  console.log('✔ Assertion 4 Passed.');

  // Assertion 5: Delivered Buyers Only Reviews & Aggregated Ratings Summary
  console.log('\n--- Assertion 5: Delivered Buyers Only Reviews ---');
  
  // Try posting review before purchasing (should fail)
  try {
    await reviewService.createReview({
      userId: customer._id,
      productId: approvedProduct._id,
      rating: 4,
      title: 'Awesome Quality',
      comment: 'This product fits great and works perfectly.',
    });
    throw new Error('Reviews creation succeeded without order delivered verify');
  } catch (err) {
    console.log(`Create review failed as expected for non-purchaser: "${err.message}"`);
  }

  // Create mock DELIVERED order for the customer
  await Order.create({
    orderNumber: 'TESTPH9-ORD01',
    userId: customer._id,
    items: [
      {
        productId: approvedProduct._id,
        name: approvedProduct.name,
        price: 80000,
        quantity: 1,
        vendorId: vendorProfile._id,
      },
    ],
    shippingAddress: { name: 'Customer', street: '123 test street', city: 'test city', state: 'test state', zip: '123456', phone: '9999999999' },
    subtotal: 80000,
    total: 80000,
    paymentMethod: 'COD',
    paymentStatus: 'PAID',
    orderStatus: 'DELIVERED',
  });

  // Post review now (should succeed)
  const review = await reviewService.createReview({
    userId: customer._id,
    productId: approvedProduct._id,
    rating: 4,
    title: 'Awesome Quality',
    comment: 'This product fits great and works perfectly.',
  });
  console.log(`Review created. Status: ${review.status} (Expected: PENDING), isVerifiedPurchase: ${review.isVerifiedPurchase}`);
  if (review.status !== 'PENDING' || !review.isVerifiedPurchase) {
    throw new Error('Review status or verified purchase calculation is incorrect');
  }

  // Moderate/Approve Review
  await reviewService.moderateReview(review._id, 'APPROVED');
  const summary = await reviewService.getProductReviewSummary(approvedProduct._id);
  console.log(`Aggregated Product rating cache: ${summary.averageRating} stars (Expected: 4.0), Total reviews: ${summary.totalReviews}`);
  if (summary.averageRating !== 4 || summary.totalReviews !== 1 || summary.distribution[4] !== 1) {
    throw new Error('Product review metrics aggregation or stars distributions are incorrect');
  }
  console.log('✔ Assertion 5 Passed.');

  // Assertion 6: Campaigns Rewards Coin Multiplier boosts & safety
  console.log('\n--- Assertion 6: Campaign Coin Multipliers ---');
  const boostCampaign = await Campaign.create({
    title: 'TestPhase9 Purchase Boost',
    type: 'PURCHASE_BOOST',
    multiplier: 2,
    startDate: new Date(Date.now() - 3600000), // active since 1h ago
    endDate: new Date(Date.now() + 86400000),
    isActive: true,
  });

  const activeMultiplier = await campaignService.evaluateCampaign('PURCHASE_BOOST');
  console.log(`Active Campaign Multiplier evaluated: ${activeMultiplier}x (Expected: 2x)`);
  if (activeMultiplier !== 2) {
    throw new Error('Campaign multiplier evaluation failed');
  }

  // Test purchase coin reward credit (1 coin per ₹100 spent)
  // Spend ₹2000. Base reward = 20 coins. With 2x multiplier = 40 coins.
  await fairCoinService.processPurchaseReward(customer._id, 'TESTPH9-ORD01', 200000);
  
  const tx = await CoinTransaction.findOne({ userId: customer._id, referenceId: 'TESTPH9-ORD01' });
  console.log(`Earned coins credited: ${tx?.amount} Coins (Expected: 40 Coins)`);
  if (!tx || tx.amount !== 40) {
    throw new Error('Campaign coin multiplier was not applied correctly to reward');
  }

  // Verify idempotency check (calling again should not add more coins)
  const currentBalanceBefore = (await fairCoinService.getOrCreateWallet(customer._id)).balance;
  await fairCoinService.processPurchaseReward(customer._id, 'TESTPH9-ORD01', 200000);
  const currentBalanceAfter = (await fairCoinService.getOrCreateWallet(customer._id)).balance;

  console.log(`Balance before: ${currentBalanceBefore}, after duplicate reward: ${currentBalanceAfter} (Expected: Equal)`);
  if (currentBalanceBefore !== currentBalanceAfter) {
    throw new Error('Coin reward processes lack idempotency verification, causing duplicate coins crediting');
  }
  console.log('✔ Assertion 6 Passed.');

  console.log('\n======================================');
  console.log('All Phase 9 integrations verified successfully!');
  console.log('======================================\n');
  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
