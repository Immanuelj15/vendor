import express from 'express';
import { getWheelConfig, spinWheel } from '../controllers/spinController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/wheel', getWheelConfig);
router.post('/spin', spinWheel);

export default router;
