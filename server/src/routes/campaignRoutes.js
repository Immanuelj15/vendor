import express from 'express';
import {
  getActiveCampaigns,
  getAdminCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  updateCampaignStatus,
} from '../controllers/campaignController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public
router.get('/active', getActiveCampaigns);

// Admin-only management
router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/admin', getAdminCampaigns);
router.get('/admin/:id', getCampaignById);
router.post('/admin', createCampaign);
router.put('/admin/:id', updateCampaign);
router.put('/admin/:id/status', updateCampaignStatus);

export default router;
