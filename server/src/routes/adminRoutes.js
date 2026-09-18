import express from 'express';
import {
  getAdminMetrics,
  getSettings,
  updateSettings,
  getAuditLogs,
  getUsers,
  getUserById,
  updateUserStatus,
  getVendors,
  getVendorById,
  updateVendorStatus,
  getVendorDashboardCounters,
  verifyVendorDocument,
  verifyVendorBank,
  getAdminNotes,
  createAdminNote,
  getShops,
  getShopById,
  updateShopStatus,
  getFranchises,
  getFranchiseById,
  updateFranchiseStatus,
  getAdminProducts,
  getProductById,
  approveProduct,
  rejectProduct,
  getOrders,
  getOrderById,
  getPayments,
  getPaymentById,
  getKycs,
  getKycById,
  updateKycStatus,
  getAdminSubscriptions,
  getAdminSubscriptionById,
  getExpiringSubscriptions,
  getCommissions,
  getCommissionById,
  getSettlements,
  getSettlementById,
  updateSettlementStatus,
  reverseSettlement,
  getCoupons,
  createCoupon,
  updateCoupon,
  updateCouponStatus,
  getCampaigns,
  createCampaign,
  updateCampaign,
  updateCampaignStatus,
  getFulfillments,
  getFulfillmentById,
  getDeliveries,
  getDeliveryById,
  getOperationalAlerts,
  exportOrdersCsv,
  exportPaymentsCsv,
  exportCommissionsCsv,
  exportSettlementsCsv,
  exportUsersCsv,
  getRevenueAnalytics,
  getOrderAnalytics,
  getCustomerAnalytics,
  getVendorAnalytics,
  getShopAnalytics,
  getFranchiseAnalytics,
  getKycAnalytics,
  getSubscriptionAnalytics,
  getCommissionAnalytics,
  getSettlementAnalytics,
  getFairCoinAnalytics,
  getProductAnalytics,
  getCouponAnalytics,
  getCampaignAnalytics,
  getFulfillmentAnalytics,
  getDeliveryAnalytics,
  getShopAttributions,
  getVendorArea,
  assignVendorArea
} from '../controllers/adminController.js';
import {
  createSubscriptionPlan,
  getSubscriptionPlans,
  updateSubscriptionPlan,
  togglePlanStatus
} from '../controllers/subscriptionPlanController.js';
import {
  getPlans,
  createPlan,
  updatePlan,
  adjustSuperCoins
} from '../controllers/adminPremiumController.js';
import adminOfflineBillRoutes from './adminOfflineBillRoutes.js';
import adminAttributionRoutes from './adminAttributionRoutes.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import {
  userStatusSchema,
  vendorStatusSchema,
  productStatusSchema,
} from '../validators/adminValidator.js';

import { getVendorNetwork } from '../controllers/adminVendorNetworkController.js';
import { runPaymentReconciliation } from '../controllers/reconciliationController.js';
import { getRoles, createRole, updateRole, getAdmins, createAdmin, updateAdmin } from '../controllers/adminManagementController.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

// Rate limit all mutative (non-GET) admin requests
router.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return mutationLimiter(req, res, next);
  }
  next();
});

// Admin & Role Management
router.get('/roles', getRoles);
router.post('/roles', createRole);
router.put('/roles/:id', updateRole);
router.get('/admins', getAdmins);
router.post('/admins', createAdmin);
router.put('/admins/:id', updateAdmin);

// Vendor Network
router.get('/vendors/:vendorId/network', requirePermission('vendor.view'), getVendorNetwork);

// Finance & Settlements
import { getFinanceDashboard, getPlatformRevenue, getExceptions, createAdjustment, processSettlements } from '../controllers/adminFinanceController.js';
router.get('/finance/dashboard', requirePermission('payment.view'), getFinanceDashboard);
router.get('/finance/revenue', requirePermission('payment.view'), getPlatformRevenue);
router.get('/finance/exceptions', requirePermission('payment.view'), getExceptions);
router.post('/finance/adjustments', requirePermission('settlement.process'), createAdjustment);
router.post('/finance/settlements/process-batch', requirePermission('settlement.process'), processSettlements);

// Payment Reconciliation
router.get('/finance/reconciliation', requirePermission('payment.view'), runPaymentReconciliation);

// Premium/Rewards Management
router.get('/customer-premium/plans', requirePermission('reward.view'), getPlans);
router.post('/customer-premium/plans', requirePermission('reward.manage'), createPlan);
router.put('/customer-premium/plans/:id', requirePermission('reward.manage'), updatePlan);
router.post('/customers/:id/super-coin-adjustment', requirePermission('reward.manage'), adjustSuperCoins);

// Offline Bills
router.use('/offline-bills', requirePermission('bill.view'), adminOfflineBillRoutes);

// Customer Attribution
router.use('/attributions', requirePermission('attribution.view'), adminAttributionRoutes);

// Base Admin Endpoints
router.get('/metrics', getAdminMetrics);
router.get('/settings', getSettings);
router.post('/settings', updateSettings);
router.put('/settings', updateSettings);
router.get('/audit-logs', requirePermission('audit.view'), getAuditLogs);
router.get('/alerts', getOperationalAlerts);

// User Management
router.get('/users', requirePermission('customer.view'), getUsers);
router.get('/users/:id', requirePermission('customer.view'), getUserById);
router.put('/users/:id/status', requirePermission('customer.suspend'), validateBody(userStatusSchema), updateUserStatus);

// Vendor Management
router.get('/vendors/dashboard-counters', getVendorDashboardCounters);
router.get('/vendors', getVendors);
router.get('/vendors/:id', getVendorById);
router.put('/vendors/:id/status', validateBody(vendorStatusSchema), updateVendorStatus);
router.put('/vendors/:id/documents/:docType/verify', verifyVendorDocument);
router.put('/vendors/:id/bank/verify', verifyVendorBank);
router.get('/vendors/:id/internal-notes', getAdminNotes);
router.post('/vendors/:id/internal-notes', createAdminNote);
router.get('/vendors/:id/area', getVendorArea);
router.put('/vendors/:id/area', assignVendorArea);

// Shop Management
router.get('/shops', getShops);
router.get('/shops/:id', getShopById);
router.put('/shops/:id/status', updateShopStatus);

// Franchise Management
router.get('/franchises', getFranchises);
router.get('/franchises/:id', getFranchiseById);
router.put('/franchises/:id/status', updateFranchiseStatus);

// Product Approval Workflow
router.get('/products', getAdminProducts);
router.get('/products/:id', getProductById);
router.post('/products/:id/approve', approveProduct);
router.post('/products/:id/reject', rejectProduct);

// Order Management
router.get('/orders', getOrders);
router.get('/orders/:id', getOrderById);

// Payment Management
router.get('/payments', getPayments);
router.get('/payments/:id', getPaymentById);

// KYC Management
router.get('/kyc', getKycs);
router.get('/kyc/:id', getKycById);
router.put('/kyc/:id/status', updateKycStatus);

// Subscription Management
router.get('/subscription-plans', getSubscriptionPlans);
router.post('/subscription-plans', createSubscriptionPlan);
router.put('/subscription-plans/:id', updateSubscriptionPlan);
router.put('/subscription-plans/:id/status', togglePlanStatus);

router.get('/subscriptions', getAdminSubscriptions);
router.get('/subscriptions/expiring', getExpiringSubscriptions);
router.get('/subscriptions/:id', getAdminSubscriptionById);

// Commission Management
router.get('/commissions', getCommissions);
router.get('/commissions/:id', getCommissionById);

// Settlement Management
router.get('/settlements', getSettlements);
router.get('/settlements/:id', getSettlementById);
router.put('/settlements/:id/status', updateSettlementStatus);
router.post('/settlements/:id/reverse', reverseSettlement); // Controlled reversal

// Coupons
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.put('/coupons/:id/status', updateCouponStatus);

// Campaigns
router.get('/campaigns', getCampaigns);
router.post('/campaigns', createCampaign);
router.put('/campaigns/:id', updateCampaign);
router.put('/campaigns/:id/status', updateCampaignStatus);

// Fulfillment
router.get('/fulfillments', getFulfillments);
router.get('/fulfillments/:id', getFulfillmentById);

// Delivery
router.get('/deliveries', getDeliveries);
router.get('/deliveries/:id', getDeliveryById);

// CSV Export Routes
router.get('/exports/orders', exportOrdersCsv);
router.get('/exports/payments', exportPaymentsCsv);
router.get('/exports/commissions', exportCommissionsCsv);
router.get('/exports/settlements', exportSettlementsCsv);
router.get('/exports/users', exportUsersCsv);

// Analytics
router.get('/analytics/revenue', getRevenueAnalytics);
router.get('/analytics/orders', getOrderAnalytics);
router.get('/analytics/customers', getCustomerAnalytics);
router.get('/analytics/vendors', getVendorAnalytics);
router.get('/analytics/shops', getShopAnalytics);
router.get('/analytics/franchises', getFranchiseAnalytics);
router.get('/analytics/kyc', getKycAnalytics);
router.get('/analytics/subscriptions', getSubscriptionAnalytics);
router.get('/analytics/commissions', getCommissionAnalytics);
router.get('/analytics/settlements', getSettlementAnalytics);
router.get('/analytics/fair-coins', getFairCoinAnalytics);
router.get('/analytics/products', getProductAnalytics);
router.get('/analytics/coupons', getCouponAnalytics);
router.get('/analytics/campaigns', getCampaignAnalytics);
router.get('/analytics/fulfillments', getFulfillmentAnalytics);
router.get('/analytics/deliveries', getDeliveryAnalytics);

// Shop Attributions Logs
router.get('/shop-attributions', getShopAttributions);

export default router;
