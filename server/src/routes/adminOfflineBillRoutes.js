import express from 'express';
import { 
  getAllBills, 
  getBillById, 
  approveBill, 
  rejectBill,
  getRewardRules,
  createRewardRule,
  updateRewardRule
} from '../controllers/adminOfflineBillController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Handled in adminRoutes as a prefix, but adding explicit role check just in case
router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

// Reward Rules
router.get('/reward-rules', getRewardRules);
router.post('/reward-rules', createRewardRule);
router.put('/reward-rules/:id', updateRewardRule);

// Bills Management
router.get('/', getAllBills);
router.get('/:id', getBillById);
router.post('/:id/approve', approveBill);
router.post('/:id/reject', rejectBill);

export default router;
