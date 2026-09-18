import express from 'express';
import {
  registerVendor,
  submitBusinessInfo,
  submitLocationInfo,
  submitKycInfo,
  submitBankInfo,
  submitFinalOnboarding,
  getOnboardingStatus,
  resubmitVendor
} from '../controllers/vendorOnboardingController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerVendor); // Open route, creates User and Vendor
router.get('/status', authenticate, getOnboardingStatus);
router.post('/business', authenticate, submitBusinessInfo);
router.post('/location', authenticate, submitLocationInfo);
router.post('/kyc', authenticate, submitKycInfo);
router.post('/bank', authenticate, submitBankInfo);
router.post('/submit', authenticate, submitFinalOnboarding);
router.post('/resubmit', authenticate, resubmitVendor);

export default router;
