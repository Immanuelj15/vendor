import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import {
  createTerritorySchema,
  createFranchiseSchema,
  updateFranchiseStatusSchema,
} from '../validators/franchiseValidator.js';
import {
  createTerritory,
  listTerritories,
  appointFranchise,
  approveFranchise,
  updateFranchiseStatus,
  getFranchiseById,
  listFranchises,
  getFranchiseChildren,
  getFranchiseDashboard,
  getFranchiseEarnings,
  getFranchiseHistory,
} from '../controllers/franchiseController.js';

const router = express.Router();

router.use(authenticate);

// Territory Management
router.post('/territories', authorize('SUPER_ADMIN', 'ADMIN'), validateBody(createTerritorySchema), createTerritory);
router.get('/territories', listTerritories);

// Franchise Appointment & Approval
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'STATE_FRANCHISE', 'DISTRICT_FRANCHISE'), validateBody(createFranchiseSchema), appointFranchise);
router.put('/:id/approve', authorize('SUPER_ADMIN', 'ADMIN'), approveFranchise);
router.put('/:id/status', validateBody(updateFranchiseStatusSchema), updateFranchiseStatus);

// Retrieval & Dashboards
router.get('/', authorize('SUPER_ADMIN', 'ADMIN', 'STATE_FRANCHISE', 'DISTRICT_FRANCHISE', 'TALUK_FRANCHISE'), listFranchises);
router.get('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'STATE_FRANCHISE', 'DISTRICT_FRANCHISE', 'TALUK_FRANCHISE'), getFranchiseById);
router.get('/:id/children', authorize('SUPER_ADMIN', 'ADMIN', 'STATE_FRANCHISE', 'DISTRICT_FRANCHISE', 'TALUK_FRANCHISE'), getFranchiseChildren);
router.get('/:id/dashboard', authorize('SUPER_ADMIN', 'ADMIN', 'STATE_FRANCHISE', 'DISTRICT_FRANCHISE', 'TALUK_FRANCHISE'), getFranchiseDashboard);
router.get('/:id/earnings', authorize('SUPER_ADMIN', 'ADMIN', 'STATE_FRANCHISE', 'DISTRICT_FRANCHISE', 'TALUK_FRANCHISE'), getFranchiseEarnings);
router.get('/:id/history', authorize('SUPER_ADMIN', 'ADMIN'), getFranchiseHistory);

export default router;
