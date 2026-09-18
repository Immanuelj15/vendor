import express from 'express';
import {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  resetUserPassword,
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAnalytics,
  getAuditLogs,
  getSettings,
  updateSettings,
  toggleMaintenanceMode,
  getRolesMatrix,
  getMLMTree,
  getMLMCommissions,
  getCommissionSettings,
  updateCommissionSettings,
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getPayoutRequests,
  approvePayoutRequest,
  rejectPayoutRequest,
  getFinancialLedger,
  getOrderFinancialLineage,
} from '../controllers/superAdminController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireSuperAdmin } from '../middleware/superAdminMiddleware.js';

const router = express.Router();

// Strict Backend Security:
// Every route under /api/super-admin is protected by both JWT authentication AND the SUPER_ADMIN role check.
router.use(authenticate);
router.use(requireSuperAdmin);

// 1. Dashboard
router.get('/dashboard', getDashboardStats);

// 2. User Management
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.post('/users/:id/reset-password', resetUserPassword);

// 3. Admin & Super Admin Management
router.get('/admins', getAdmins);
router.post('/admins', createAdmin);
router.put('/admins/:id', updateAdmin);
router.delete('/admins/:id', deleteAdmin);
router.post('/admins/:id/reset-password', resetUserPassword);

// 4. Analytics
router.get('/analytics', getAnalytics);

// 5. Audit Logs
router.get('/audit-logs', getAuditLogs);

// 6. Settings & Maintenance Mode
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.post('/settings/maintenance', toggleMaintenanceMode);

// 7. Roles & Permissions
router.get('/roles', getRolesMatrix);

// 8. 9-Level MLM Network & Commissions
router.get('/mlm/tree', getMLMTree);
router.get('/mlm/commissions', getMLMCommissions);

// 9. Commission Rules & Percentage Settings
router.get('/commissions/settings', getCommissionSettings);
router.put('/commissions/settings', updateCommissionSettings);

// 10. Subscription Plans (Vendor & Customer)
router.get('/subscriptions/plans', getSubscriptionPlans);
router.post('/subscriptions/plans', createSubscriptionPlan);
router.put('/subscriptions/plans/:id', updateSubscriptionPlan);
router.delete('/subscriptions/plans/:id', deleteSubscriptionPlan);

// 11. Vendor Payouts / Withdrawals
router.get('/payouts', getPayoutRequests);
router.post('/payouts/:id/approve', approvePayoutRequest);
router.post('/payouts/:id/reject', rejectPayoutRequest);

// 12. Double-Entry Financial Ledger
router.get('/ledger', getFinancialLedger);

// 13. Financial Transaction Explorer (Full 360-degree Lineage)
router.get('/finance/trace/:orderId', getOrderFinancialLineage);

export default router;

