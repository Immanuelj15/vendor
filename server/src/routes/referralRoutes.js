import express from 'express';
import { getReferralLink, getReferralTree, getNetworkSummary, sendTeamMessage, getTeamMessages } from '../controllers/referralController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/my-link', getReferralLink);
router.get('/tree', getReferralTree);
router.get('/network-summary', getNetworkSummary);
router.post('/team-message', sendTeamMessage);
router.get('/team-messages', getTeamMessages);

export default router;
