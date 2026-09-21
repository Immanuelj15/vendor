import express from 'express';
import {
  registerVendor,
  getVendorDashboard,
  createVendorProduct,
  requestWithdrawal,
  getVendorProfile,
  updateVendorProfile,
  updateVendorDocuments,
  updateVendorBank,
  getVendorStatusHistory,
  getVendorProducts,
  getVendorProductById,
  updateVendorProduct,
  deleteVendorProduct,
  changeVendorProductStatus,
  getVendorOrders,
  getVendorOrderById
} from '../controllers/vendorController.js';
import { getCategories } from '../controllers/categoryController.js';
import {
  getVendorQR,
  getVendorQRDashboardStats,
  getVendorCustomers
} from '../controllers/qrAttributionController.js';
import { getVendorStatement, getVendorSettlements } from '../controllers/vendorFinanceController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { vendorRegisterSchema } from '../validators/adminValidator.js';

const router = express.Router();

router.use(authenticate);

// Categories for vendor product creation
router.get('/categories', getCategories);

// Any authenticated user can submit a vendor registration application
router.post('/register', validateBody(vendorRegisterSchema), registerVendor);

// Restrict actual vendor operational features to approved vendors and admins
router.get('/dashboard', authorize('VENDOR', 'ADMIN', 'SUPER_ADMIN'), getVendorDashboard);
router.post('/withdraw', authorize('VENDOR', 'ADMIN', 'SUPER_ADMIN'), requestWithdrawal);

// Vendor Product Management
router.get('/products', authorize('VENDOR', 'ADMIN', 'SUPER_ADMIN'), getVendorProducts);
router.get('/products/:id', authorize('VENDOR', 'ADMIN', 'SUPER_ADMIN'), getVendorProductById);
import {
  acceptOrder,
  processOrder,
  packOrder,
  markReadyToShip,
  getVendorDashboardStats
} from '../controllers/vendorOrderController.js';

router.post('/products', authorize('VENDOR', 'ADMIN', 'SUPER_ADMIN'), createVendorProduct);
router.put('/products/:id', authorize('VENDOR', 'ADMIN', 'SUPER_ADMIN'), updateVendorProduct);
router.delete('/products/:id', authorize('VENDOR', 'ADMIN', 'SUPER_ADMIN'), deleteVendorProduct);
router.post('/products/:id/status', authorize('VENDOR', 'ADMIN', 'SUPER_ADMIN'), changeVendorProductStatus);

// Vendor Orders Dashboard
router.get('/orders/stats', authorize('VENDOR'), getVendorDashboardStats);

// Vendor Orders
router.get('/orders', authorize('VENDOR', 'ADMIN', 'SUPER_ADMIN'), getVendorOrders);
router.get('/orders/:id', authorize('VENDOR', 'ADMIN', 'SUPER_ADMIN'), getVendorOrderById);

// Vendor Order Processing Flow (Module 9)
router.post('/orders/:id/accept', authorize('VENDOR'), acceptOrder);
router.post('/orders/:id/process', authorize('VENDOR'), processOrder);
router.post('/orders/:id/pack', authorize('VENDOR'), packOrder);
router.post('/orders/:id/ready-to-ship', authorize('VENDOR'), markReadyToShip);

// Profile Management (Accessible to PENDING/REJECTED/UNDER_REVIEW/APPROVED)
router.get('/me', getVendorProfile);
router.put('/me', updateVendorProfile);
router.put('/documents/:docType', updateVendorDocuments);
router.put('/bank', updateVendorBank);
router.get('/status-history', getVendorStatusHistory);

// Vendor Finance & Settlements
router.get('/finance/statement', authorize('VENDOR', 'ADMIN', 'SUPER_ADMIN'), getVendorStatement);
router.get('/finance/settlements', authorize('VENDOR', 'ADMIN', 'SUPER_ADMIN'), getVendorSettlements);

// Vendor QR & Attribution
router.get('/qr', authorize('VENDOR', 'ADMIN', 'SUPER_ADMIN'), getVendorQR);
router.get('/qr/stats', authorize('VENDOR', 'ADMIN', 'SUPER_ADMIN'), getVendorQRDashboardStats);
router.get('/customers', authorize('VENDOR', 'ADMIN', 'SUPER_ADMIN'), getVendorCustomers);

export default router;
