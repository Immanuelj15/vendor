import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  setupMFA,
  enableMFA,
  verifyMFA,
  verifyRecoveryCode,
  disableMFA,
} from '../controllers/mfaController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// Strict Rate Limiting on MFA Endpoints to prevent brute force
const mfaLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 attempts per window
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many MFA verification attempts. Please try again in 5 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(mfaLimiter);

router.post('/setup', setupMFA);
router.post('/enable', enableMFA);
router.post('/verify', verifyMFA);
router.post('/recovery', verifyRecoveryCode);
router.post('/disable', authenticate, disableMFA);

export default router;
