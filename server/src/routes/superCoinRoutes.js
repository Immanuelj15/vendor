import express from 'express';
import { getWallet, getHistory } from '../controllers/superCoinController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('CUSTOMER'));

router.get('/', getWallet);
router.get('/history', getHistory);

export default router;
