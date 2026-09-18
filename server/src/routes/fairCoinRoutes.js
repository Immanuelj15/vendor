import express from 'express';
import { getWallet, getTransactions } from '../controllers/fairCoinController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/wallet', getWallet);
router.get('/transactions', getTransactions);

export default router;
