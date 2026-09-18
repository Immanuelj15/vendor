import express from 'express';
import { handleQRScan } from '../controllers/publicReferralController.js';

const router = express.Router();

// Public route - no auth middleware
router.get('/:referralCode', handleQRScan);

export default router;
