import dns from 'dns';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}
import { User } from '../src/models/User.js';
import { Role } from '../src/models/Role.js';
import { Settings } from '../src/models/Settings.js';
import { Category } from '../src/models/Category.js';
import { Brand } from '../src/models/Brand.js';
import { Vendor } from '../src/models/Vendor.js';
import { Product } from '../src/models/Product.js';
import { SpinWheel } from '../src/models/SpinWheel.js';
import { Referral } from '../src/models/Referral.js';
import { SubscriptionPlan } from '../src/models/SubscriptionPlan.js';
import { CustomerSubscriptionPlan } from '../src/models/CustomerSubscriptionPlan.js';
import { BillRewardRule } from '../src/models/BillRewardRule.js';
import { ROLES, USER_STATUS } from '../src/constants/roles.js';
import { env } from '../src/config/env.js';

const DEMO_PASSWORD = 'Password@123';

async function seedDatabase() {
  console.log('🌱 Seeding Complete FairKart Platform Ecosystem (Categories, Products, Vendors, MLM, Spin Wheel)...\n');

  try {
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB');

    // 1. Roles
    const rolesData = [
      { name: ROLES.SUPER_ADMIN, description: 'Super Administrator with full platform authority' },
      { name: ROLES.ADMIN, description: 'Platform Operational Administrator' },
      { name: ROLES.USER, description: 'Standard Customer & Referral Partner' },
    ];
    for (const r of rolesData) {
      await Role.findOneAndUpdate({ name: r.name }, r, { upsert: true });
    }

    // 2. Demo Users & Referral Tree
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, salt);

    const superAdmin = await User.findOneAndUpdate(
      { email: 'admin@fairkart.dev' },
      {
        name: 'Super Admin',
        email: 'admin@fairkart.dev',
        passwordHash,
        role: ROLES.SUPER_ADMIN,
        status: USER_STATUS.ACTIVE,
        referralCode: 'SUPER100',
        fairCoinBalance: 5000,
        emailVerified: true,
      },
      { upsert: true, new: true }
    );

    const admin = await User.findOneAndUpdate(
      { email: 'manager@fairkart.dev' },
      {
        name: 'Platform Manager',
        email: 'manager@fairkart.dev',
        passwordHash,
        role: ROLES.ADMIN,
        status: USER_STATUS.ACTIVE,
        referralCode: 'ADMIN200',
        fairCoinBalance: 2000,
        emailVerified: true,
      },
      { upsert: true, new: true }
    );

    const vendorUser = await User.findOneAndUpdate(
      { email: 'vendor@fairkart.dev' },
      {
        name: 'Demo Vendor Partner',
        email: 'vendor@fairkart.dev',
        passwordHash,
        role: ROLES.VENDOR,
        status: USER_STATUS.ACTIVE,
        referralCode: 'VENDOR01',
        fairCoinBalance: 1500,
        emailVerified: true,
      },
      { upsert: true, new: true }
    );

    const mainCustomer = await User.findOneAndUpdate(
      { email: 'user@fairkart.dev' },
      {
        name: 'Immanuel (Demo Customer)',
        email: 'user@fairkart.dev',
        passwordHash,
        role: ROLES.USER,
        status: USER_STATUS.ACTIVE,
        referralCode: 'IMMA8294',
        fairCoinBalance: 500,
        emailVerified: true,
      },
      { upsert: true, new: true }
    );

    // Level 1 Referral of mainCustomer
    const refUser1 = await User.findOneAndUpdate(
      { email: 'referral1@fairkart.dev' },
      {
        name: 'Alex Rivera (Level 1)',
        email: 'referral1@fairkart.dev',
        passwordHash,
        role: ROLES.USER,
        status: USER_STATUS.ACTIVE,
        referralCode: 'ALEX1000',
        referredBy: mainCustomer._id,
        fairCoinBalance: 200,
        emailVerified: true,
      },
      { upsert: true, new: true }
    );

    // Create Referral Node relationship
    await Referral.findOneAndUpdate(
      { userId: mainCustomer._id, referredUserId: refUser1._id },
      { userId: mainCustomer._id, referredUserId: refUser1._id, level: 1, status: 'ACTIVE' },
      { upsert: true }
    );

    console.log('  [Users & MLM] Seeded demo accounts and referral tree');

    // 3. Vendor Store Profile
    const vendorStore = await Vendor.findOneAndUpdate(
      { userId: vendorUser._id },
      {
        userId: vendorUser._id,
        storeName: 'TechKraft Electronics & Lifestyle',
        slug: 'techkraft-electronics',
        description: 'Official verified marketplace vendor for premium gadgets & lifestyle goods.',
        status: 'APPROVED',
        commissionRate: 10,
        balance: 12500,
        totalSales: 45000,
      },
      { upsert: true, new: true }
    );

    // 4. Categories & Brands
    const catElectronics = await Category.findOneAndUpdate(
      { slug: 'electronics' },
      { name: 'Electronics & Gadgets', slug: 'electronics', description: 'Smartphones, Audio, Wearables' },
      { upsert: true, new: true }
    );

    const catFashion = await Category.findOneAndUpdate(
      { slug: 'fashion' },
      { name: 'Fashion & Apparel', slug: 'fashion', description: 'Trendy Clothing & Accessories' },
      { upsert: true, new: true }
    );

    const brandTech = await Brand.findOneAndUpdate(
      { slug: 'fairtech' },
      { name: 'FairTech', slug: 'fairtech' },
      { upsert: true, new: true }
    );

    // 5. Products
    const sampleProducts = [
      {
        name: 'FairPro Wireless Noise-Canceling Earbuds',
        slug: 'fairpro-wireless-earbuds',
        price: 2999,
        discountPrice: 2499,
        stock: 50,
        sku: 'FK-EAR-001',
        description: 'Active Noise Cancellation, 30-hour battery life, immersive HD bass.',
        images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600'],
        coinReward: 50,
        categoryId: catElectronics._id,
        brandId: brandTech._id,
        vendorId: vendorStore._id,
        status: 'APPROVED',
      },
      {
        name: 'FairPulse Smart Fitness Watch Ultra',
        slug: 'fairpulse-smart-watch',
        price: 4999,
        discountPrice: 3999,
        stock: 35,
        sku: 'FK-WTC-002',
        description: 'AMOLED display, SpO2 & Heart Rate tracking, IP68 water resistant.',
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'],
        coinReward: 100,
        categoryId: catElectronics._id,
        brandId: brandTech._id,
        vendorId: vendorStore._id,
        status: 'APPROVED',
      },
      {
        name: 'Organic Cotton FairKart Eco Tote Bag',
        slug: 'eco-tote-bag',
        price: 799,
        discountPrice: 499,
        stock: 100,
        sku: 'FK-BAG-003',
        description: 'Sustainable 100% organic cotton bag with reinforced handles.',
        images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?w=600'],
        coinReward: 20,
        categoryId: catFashion._id,
        vendorId: vendorStore._id,
        status: 'APPROVED',
      },
    ];

    for (const p of sampleProducts) {
      await Product.findOneAndUpdate({ slug: p.slug }, p, { upsert: true });
    }
    console.log('  [Products] Seeded sample marketplace products');

    // 6. Spin Wheel
    await SpinWheel.findOneAndUpdate(
      { isActive: true },
      {
        title: 'Daily FairKart Spin & Win',
        description: 'Spin the wheel every day to win instant Fair Coins & Coupons!',
        isActive: true,
        dailySpinsPerUser: 1,
        rewards: [
          { title: '10 Fair Coins', type: 'FAIR_COINS', value: 10, probability: 30, color: '#22c55e' },
          { title: '20 Fair Coins', type: 'FAIR_COINS', value: 20, probability: 25, color: '#3b82f6' },
          { title: '50 Fair Coins', type: 'FAIR_COINS', value: 50, probability: 15, color: '#8b5cf6' },
          { title: '100 Fair Coins', type: 'FAIR_COINS', value: 100, probability: 10, color: '#ec4899' },
          { title: '200 Fair Coins', type: 'FAIR_COINS', value: 200, probability: 5, color: '#eab308' },
          { title: 'Try Again', type: 'TRY_AGAIN', value: 0, probability: 15, color: '#64748b' },
        ],
      },
      { upsert: true }
    );

    // 7. System Settings
    await Settings.findOneAndUpdate(
      { key: 'MLM_CONFIG' },
      {
        key: 'MLM_CONFIG',
        category: 'MLM',
        value: {
          maxLevels: 3,
          levels: [
            { level: 1, percentage: 10, name: 'Level 1 (Direct)' },
            { level: 2, percentage: 5, name: 'Level 2' },
            { level: 3, percentage: 2, name: 'Level 3' },
          ],
        },
      },
      { upsert: true }
    );

    // 8. Subscription Plans
    const plansData = [
      {
        name: 'Shopkeeper Annual Subscription',
        code: 'SHOPKEEPER_ANNUAL',
        description: 'Standard annual subscription plan for shopkeepers.',
        price: 5000,
        currency: 'INR',
        durationDays: 365,
        applicableEntityType: 'SHOPKEEPER',
        features: ['Onboard Unlimited Customers', 'Generate Shop QR Code', 'Earn Shop Commissions'],
        isActive: true,
      },
      {
        name: 'Franchise Annual Subscription',
        code: 'FRANCHISE_ANNUAL',
        description: 'Annual subscription plan for territory franchise operators.',
        price: 15000,
        currency: 'INR',
        durationDays: 365,
        applicableEntityType: 'FRANCHISE',
        features: ['Territory Management', 'Appoint Shopkeepers', 'Earn Franchise Overrides'],
        isActive: true,
      },
      {
        name: 'Shop Annual Subscription',
        code: 'SHOP_ANNUAL',
        description: 'Annual subscription plan for shops.',
        price: 3000,
        currency: 'INR',
        durationDays: 365,
        applicableEntityType: 'SHOP',
        features: ['Customer Scans & Attribution', 'Shop Listing', 'Shop Statistics'],
        isActive: true,
      },
    ];

    for (const plan of plansData) {
      await SubscriptionPlan.findOneAndUpdate({ code: plan.code }, plan, { upsert: true });
    }
    console.log('  [Subscriptions] Seeded default subscription plans');

    // 9. Customer Premium Subscription Plans
    const customerPlansData = [
      {
        name: 'Premium Monthly',
        code: 'PREMIUM_MONTHLY',
        description: 'Standard monthly premium access with bonus coins and daily spins.',
        durationValue: 1,
        durationUnit: 'MONTH',
        price: 199,
        currency: 'INR',
        rewardRules: {
          coinsOnSubscribe: 100,
          superCoinsOnSubscribe: 10,
          monthlyCoinAllowance: 50,
        },
        status: 'ACTIVE',
      },
      {
        name: 'Premium Quarterly',
        code: 'PREMIUM_QUARTERLY',
        description: 'Quarterly premium membership with 300 bonus Fair Coins and extra perks.',
        durationValue: 3,
        durationUnit: 'MONTH',
        price: 499,
        currency: 'INR',
        rewardRules: {
          coinsOnSubscribe: 300,
          superCoinsOnSubscribe: 35,
          monthlyCoinAllowance: 75,
        },
        status: 'ACTIVE',
      },
      {
        name: 'Premium Half-Yearly',
        code: 'PREMIUM_HALF_YEARLY',
        description: '6 Months premium pass with 700 bonus Fair Coins and priority discounts.',
        durationValue: 6,
        durationUnit: 'MONTH',
        price: 899,
        currency: 'INR',
        rewardRules: {
          coinsOnSubscribe: 700,
          superCoinsOnSubscribe: 80,
          monthlyCoinAllowance: 100,
        },
        status: 'ACTIVE',
      },
      {
        name: 'Premium Annual Ultra',
        code: 'PREMIUM_ANNUAL',
        description: 'Full year of unlimited VIP benefits, 1500 Fair Coins bonus & 200 Super Coins.',
        durationValue: 1,
        durationUnit: 'YEAR',
        price: 1499,
        currency: 'INR',
        rewardRules: {
          coinsOnSubscribe: 1500,
          superCoinsOnSubscribe: 200,
          monthlyCoinAllowance: 150,
        },
        status: 'ACTIVE',
      },
    ];

    for (const cp of customerPlansData) {
      await CustomerSubscriptionPlan.findOneAndUpdate({ code: cp.code }, cp, { upsert: true });
    }
    console.log('  [Customer Premium] Seeded default customer premium plans');

    // 10. Offline Shop Bill Reward Rule
    await BillRewardRule.findOneAndUpdate(
      { status: 'ACTIVE' },
      {
        rewardType: 'PER_AMOUNT_SUPER_COINS',
        basis: 100,
        rate: 5,
        minimumPurchaseAmount: 100,
        maxReward: 500,
        premiumMultiplier: 1.5,
        status: 'ACTIVE',
      },
      { upsert: true }
    );
    console.log('  [Offline Bills] Seeded default bill reward rule');

    console.log('\n✨ COMPLETE ECOSYSTEM SEEDED SUCCESSFULLY! ✨\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();
