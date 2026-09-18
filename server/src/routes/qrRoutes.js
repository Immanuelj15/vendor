import express from 'express';
import { handleQRScan, processPendingQRScan } from '../controllers/qrAttributionController.js';
import { authenticate, optionalAuthenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// The public scan route. If a user is logged in (auth token provided), they are parsed.
router.get('/:token', optionalAuthenticate, handleQRScan);

// The explicitly authenticated route for processing a pending scan after login/registration.
router.post('/process', authenticate, processPendingQRScan);

export default router;
