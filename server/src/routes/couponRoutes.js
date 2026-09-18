import express from 'express';
import {
  validateCoupon,
  getAdminCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/couponController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public / Authenticated coupon validation
router.post('/validate', authenticate, validateCoupon);

// Admin-only management
router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/admin', getAdminCoupons);
router.get('/admin/:id', getCouponById);
router.post('/admin', createCoupon);
router.put('/admin/:id', updateCoupon);
router.delete('/admin/:id', deleteCoupon);

export default router;
