import express from 'express';
import { register, login, refreshToken, logout, getMe } from '../controllers/authController.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/authValidator.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.post('/refresh-token', validateBody(refreshTokenSchema), refreshToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
