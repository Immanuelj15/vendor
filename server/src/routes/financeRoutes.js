import express from 'express';
import { 
  getAdminSettlements, 
  markSettlementPaid, 
  getVendorSettlements, 
  getVendorLedger 
} from '../controllers/financeController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

// Admin Routes
router.get('/admin/settlements', authorize('ADMIN', 'SUPER_ADMIN'), getAdminSettlements);
router.put('/admin/settlements/:id/pay', authorize('ADMIN', 'SUPER_ADMIN'), markSettlementPaid);

// Vendor Routes
router.get('/vendor/settlements', authorize('VENDOR'), getVendorSettlements);
router.get('/vendor/ledger', authorize('VENDOR'), getVendorLedger);

export default router;
