import express from 'express';
import { getPlans, subscribe, getStatus, getHistory } from '../controllers/customerPremiumController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public / Guest can view plans
router.get('/plans', getPlans);

router.use(authenticate);

router.post('/subscribe', subscribe);
router.get('/', getStatus);
router.get('/history', getHistory);

export default router;
