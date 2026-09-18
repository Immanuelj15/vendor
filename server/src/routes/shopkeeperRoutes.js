import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import {
  createShopkeeperSchema,
  createShopSchema,
  submitKycSchema,
  reviewKycSchema,
  createSubscriptionPlanSchema,
} from '../validators/franchiseValidator.js';
import {
  onboardShopkeeper,
  getShopkeeperById,
  listShopkeepers,
  submitKyc,
  reviewKyc,
  createSubscriptionPlan,
  listSubscriptionPlans,
  activateSubscription,
  renewSubscription,
  createShop,
  getShopById,
  listShops,
  updateShopStatus,
  generateShopQR,
  revokeShopQR,
  resolveShopQR,
  attributeCustomerQR,
  getMyKyc,
  getKycById,
  listKycDocuments,
  createSubscription,
  getMySubscriptions,
  getShopkeeperEarnings,
} from '../controllers/shopkeeperController.js';

const router = express.Router();

// Public QR Code Resolution
router.get('/shops/qr/:publicToken', resolveShopQR);

router.use(authenticate);

// Customer Attribution (requires authenticate)
router.post('/shops/qr/:publicToken/attribute', attributeCustomerQR);

// QR Code Generation/Revocation (authorized inside service)
router.post('/shops/:shopId/qr', generateShopQR);
router.put('/shops/:shopId/qr/revoke', revokeShopQR);

// Shopkeeper onboarding
router.post('/shopkeepers', authorize('SUPER_ADMIN', 'ADMIN', 'TALUK_FRANCHISE'), validateBody(createShopkeeperSchema), onboardShopkeeper);
router.get('/shopkeepers', authorize('SUPER_ADMIN', 'ADMIN', 'STATE_FRANCHISE', 'DISTRICT_FRANCHISE', 'TALUK_FRANCHISE'), listShopkeepers);
router.get('/shopkeepers/:id', authorize('SUPER_ADMIN', 'ADMIN', 'STATE_FRANCHISE', 'DISTRICT_FRANCHISE', 'TALUK_FRANCHISE', 'SHOPKEEPER'), getShopkeeperById);
router.get('/shopkeepers/:id/earnings', authorize('SUPER_ADMIN', 'ADMIN', 'STATE_FRANCHISE', 'DISTRICT_FRANCHISE', 'TALUK_FRANCHISE', 'SHOPKEEPER'), getShopkeeperEarnings);

// KYC
router.post('/kyc', validateBody(submitKycSchema), submitKyc);
router.get('/kyc/my', getMyKyc);
router.get('/kyc/:id', getKycById);
router.get('/kyc', authorize('SUPER_ADMIN', 'ADMIN', 'STATE_FRANCHISE', 'DISTRICT_FRANCHISE', 'TALUK_FRANCHISE'), listKycDocuments);
router.put('/kyc/:id/status', authorize('SUPER_ADMIN', 'ADMIN'), validateBody(reviewKycSchema), reviewKyc);

// Subscriptions
router.post('/subscriptions/plans', authorize('SUPER_ADMIN', 'ADMIN'), validateBody(createSubscriptionPlanSchema), createSubscriptionPlan);
router.get('/subscriptions/plans', listSubscriptionPlans);
router.post('/subscriptions', createSubscription);
router.post('/subscriptions/activate', activateSubscription);
router.get('/subscriptions/my', getMySubscriptions);
router.post('/subscriptions/:id/renew', renewSubscription);

// Shops
router.post('/shops', authorize('SUPER_ADMIN', 'ADMIN', 'TALUK_FRANCHISE'), validateBody(createShopSchema), createShop);
router.get('/shops', listShops);
router.get('/shops/:id', authorize('SUPER_ADMIN', 'ADMIN', 'STATE_FRANCHISE', 'DISTRICT_FRANCHISE', 'TALUK_FRANCHISE', 'SHOPKEEPER'), getShopById);
router.put('/shops/:id/status', authorize('SUPER_ADMIN', 'ADMIN', 'STATE_FRANCHISE', 'DISTRICT_FRANCHISE', 'TALUK_FRANCHISE'), updateShopStatus);

export default router;
