import express from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import productRoutes from './productRoutes.js';
import cartRoutes from './cartRoutes.js';
import orderRoutes from './orderRoutes.js';
import fairCoinRoutes from './fairCoinRoutes.js';
import referralRoutes from './referralRoutes.js';
import spinRoutes from './spinRoutes.js';
import vendorRoutes from './vendorRoutes.js';
import adminRoutes from './adminRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import financeRoutes from './financeRoutes.js';
import franchiseRoutes from './franchiseRoutes.js';
import shopkeeperRoutes from './shopkeeperRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import fulfillmentRoutes from './fulfillmentRoutes.js';
import hubRoutes from './hubRoutes.js';
import deliveryRoutes from './deliveryRoutes.js';
import returnRoutes from './returnRoutes.js';
import userRoutes from './userRoutes.js';
import wishlistRoutes from './wishlistRoutes.js';
import brandRoutes from './brandRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import couponRoutes from './couponRoutes.js';
import campaignRoutes from './campaignRoutes.js';
import vendorOnboardingRoutes from './vendorOnboardingRoutes.js';
import territoryRoutes from './territoryRoutes.js';
import vendorSubscriptionRoutes from './vendorSubscriptionRoutes.js';
import qrRoutes from './qrRoutes.js';

import shippingRoutes from './shippingRoutes.js';
import customerPremiumRoutes from './customerPremiumRoutes.js';
import superCoinRoutes from './superCoinRoutes.js';
import offlineBillRoutes from './offlineBillRoutes.js';
import vendorReferralRoutes from './vendorReferralRoutes.js';
import customerAttributionRoutes from './customerAttributionRoutes.js';
import publicReferralRoutes from './publicReferralRoutes.js';
import superAdminRoutes from './superAdminRoutes.js';

const router = express.Router();

router.use('/super-admin', superAdminRoutes);

router.use('/health', healthRoutes);
router.use('/territories', territoryRoutes);
router.use('/auth/vendor-onboarding', vendorOnboardingRoutes); // Added for vendor onboarding
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/fair-coins', fairCoinRoutes);
router.use('/super-coins', superCoinRoutes); // ADDED FOR MODULE 10
router.use('/customer/premium', customerPremiumRoutes); // ADDED FOR MODULE 10
router.use('/customer/offline-bills', offlineBillRoutes); // ADDED FOR MODULE 11
router.use('/customer/attribution', customerAttributionRoutes); // ADDED FOR MODULE 12
router.use('/vendor/referral', vendorReferralRoutes); // ADDED FOR MODULE 12
router.use('/r', publicReferralRoutes); // ADDED FOR MODULE 12
router.use('/referrals', referralRoutes);
router.use('/spin', spinRoutes);
router.use('/vendors', vendorRoutes);
router.use('/vendor-subscriptions', vendorSubscriptionRoutes);
router.use('/admin', adminRoutes);
router.use('/payments', paymentRoutes);
router.use('/finance', financeRoutes); // ADDED FOR MODULE 8
router.use('/shipping', shippingRoutes); // ADDED FOR MODULE 9
router.use('/franchises', franchiseRoutes);
router.use('/notifications', notificationRoutes);
router.use('/fulfillments', fulfillmentRoutes);
router.use('/hubs', hubRoutes);
router.use('/deliveries', deliveryRoutes);
router.use('/returns', returnRoutes);
router.use('/users', userRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/brands', brandRoutes);
router.use('/reviews', reviewRoutes);
router.use('/coupons', couponRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/qr', qrRoutes);
router.use('/', shopkeeperRoutes);

export default router;
