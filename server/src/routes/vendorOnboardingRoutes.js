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
import { validateBody } from '../middleware/validateMiddleware.js';
import { vendorRegistrationSchema, vendorBankSchema } from '../validators/roleAuthValidators.js';
import { authLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.post('/register', authLimiter, validateBody(vendorRegistrationSchema), registerVendor); // Open route, creates User and Vendor
router.get('/status', authenticate, getOnboardingStatus);
router.post('/business', authenticate, submitBusinessInfo);
router.post('/location', authenticate, submitLocationInfo);
router.post('/kyc', authenticate, submitKycInfo);
router.post('/bank', authenticate, validateBody(vendorBankSchema), submitBankInfo);
router.post('/submit', authenticate, submitFinalOnboarding);
router.post('/resubmit', authenticate, resubmitVendor);

export default router;
