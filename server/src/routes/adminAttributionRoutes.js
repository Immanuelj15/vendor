import express from 'express';
import { getAllAttributions, manuallyAssignVendor, revokeAttribution } from '../controllers/adminAttributionController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Role check usually handled in adminRoutes.js, but explicitly here too
router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/', getAllAttributions);
router.post('/assign', manuallyAssignVendor);
router.post('/:id/revoke', revokeAttribution);

export default router;
