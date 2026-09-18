import express from 'express';
import { getCart, addToCart, updateQuantity, applyCoupon } from '../controllers/cartController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { applyCouponSchema } from '../validators/adminValidator.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update', updateQuantity);
router.post('/apply-coupon', validateBody(applyCouponSchema), applyCoupon);

export default router;
