import express from 'express';
import {
  getAvailablePlans,
  getCurrentSubscription,
  createSubscriptionOrder,
  verifySubscriptionPayment,
  getSubscriptionHistory
} from '../controllers/vendorSubscriptionController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('VENDOR'));

router.get('/plans', getAvailablePlans);
router.get('/current', getCurrentSubscription);
router.post('/order', createSubscriptionOrder);
router.post('/verify', verifySubscriptionPayment);
router.get('/history', getSubscriptionHistory);

export default router;
