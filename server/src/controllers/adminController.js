import { adminService } from '../services/adminService.js';
import { productService } from '../services/productService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { Shop } from '../models/Shop.js';
import { Franchise } from '../models/Franchise.js';
import { Subscription } from '../models/Subscription.js';
import { KYCDocument } from '../models/KYCDocument.js';
import { Commission } from '../models/Commission.js';
import { Payment } from '../models/Payment.js';
import { VendorWithdrawal } from '../models/VendorWithdrawal.js';
import { Fulfillment } from '../models/Fulfillment.js';
import { DeliveryAssignment } from '../models/DeliveryAssignment.js';
import { CoinTransaction } from '../models/CoinTransaction.js';
import { AuditLog } from '../models/AuditLog.js';

// Date range parser
export const parseDateRange = (query) => {
  const { range, from, to } = query;
  const now = new Date();
  
  let startDate = new Date();
  let endDate = new Date();

  if (range === 'today') {
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 999);
  } else if (range === 'yesterday') {
    startDate.setUTCDate(startDate.getUTCDate() - 1);
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCDate(endDate.getUTCDate() - 1);
    endDate.setUTCHours(23, 59, 59, 999);
  } else if (range === '7days') {
    startDate.setUTCDate(startDate.getUTCDate() - 7);
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 999);
  } else if (range === '30days') {
    startDate.setUTCDate(startDate.getUTCDate() - 30);
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 999);
  } else if (range === '90days') {
    startDate.setUTCDate(startDate.getUTCDate() - 90);
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 999);
  } else if (range === 'custom') {
    if (!from || !to) {
      throw new ApiError(400, 'Custom range requires from and to parameters', ERROR_CODES.BAD_REQUEST);
    }
    startDate = new Date(from);
    endDate = new Date(to);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new ApiError(400, 'Invalid custom range date format', ERROR_CODES.BAD_REQUEST);
    }
    if (startDate > endDate) {
      throw new ApiError(400, 'Start date cannot be after end date', ERROR_CODES.BAD_REQUEST);
    }
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 366) {
      throw new ApiError(400, 'Date range cannot exceed 366 days', ERROR_CODES.BAD_REQUEST);
    }
  } else {
    // Default to last 30 days
    startDate.setUTCDate(startDate.getUTCDate() - 30);
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
};

// 1. Dashboard Metrics (Real data, no hardcoding)
export const getAdminMetrics = asyncWrapper(async (req, res) => {
  const [
    totalUsers,
    totalVendors,
    totalProducts,
    totalOrders,
    totalShops,
    totalFranchises,
    totalSubs,
    totalKycs,
    totalComms,
    totalSettlements,
    totalFulfillments,
    totalDeliveries,
    coinStats
  ] = await Promise.all([
    User.countDocuments({ role: { $in: ['CUSTOMER', 'USER'] } }),
    Vendor.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments(),
    Shop.countDocuments(),
    Franchise.countDocuments(),
    Subscription.countDocuments(),
    KYCDocument.countDocuments(),
    Commission.countDocuments(),
    VendorWithdrawal.countDocuments(),
    Fulfillment.countDocuments(),
    DeliveryAssignment.countDocuments(),
    CoinTransaction.aggregate([
      { $match: { type: 'PURCHASE_REWARD', status: 'COMPLETED' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  const revenueStats = await Order.aggregate([
    { $match: { paymentStatus: 'PAID' } },
    { $group: { _id: null, total: { $sum: '$total' } } }
  ]);
  const totalRevenue = revenueStats[0]?.total || 0;
  const totalCoinsIssued = coinStats[0]?.total || 0;

  return res.status(200).json(new ApiResponse(200, {
    metrics: {
      totalRevenue,
      totalUsers,
      totalVendors,
      totalProducts,
      totalOrders,
      totalShops,
      totalFranchises,
      totalSubs,
      totalKycs,
      totalComms,
      totalSettlements,
      totalFulfillments,
      totalDeliveries,
      totalCoinsIssued
    }
  }, 'Dashboard metrics retrieved'));
});

// 2. Settings Management
export const getSettings = asyncWrapper(async (req, res) => {
  const settings = await adminService.getSettings();
  return res.status(200).json(new ApiResponse(200, { settings }, 'Settings retrieved'));
});

export const updateSettings = asyncWrapper(async (req, res) => {
  const { key, value, category } = req.body;
  if (!key || value === undefined) {
    throw new ApiError(400, 'Settings key and value are required', ERROR_CODES.BAD_REQUEST);
  }
  const settings = await adminService.updateSettings(key, value, category, req.user, req.ip);
  return res.status(200).json(new ApiResponse(200, { settings }, 'Settings updated successfully'));
});

// 3. User Management
export const getUsers = asyncWrapper(async (req, res) => {
  const result = await adminService.getUsers(req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Users retrieved'));
});

export const getUserById = asyncWrapper(async (req, res) => {
  const user = await adminService.getUserById(req.params.id);
  return res.status(200).json(new ApiResponse(200, { user }, 'User details retrieved'));
});

export const updateUserStatus = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const user = await adminService.updateUserStatus(id, status, req.user);
  return res.status(200).json(new ApiResponse(200, { user }, `User status updated to ${status}`));
});

// 4. Vendor Management
export const getVendors = asyncWrapper(async (req, res) => {
  const result = await adminService.getVendors(req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Vendors retrieved'));
});

export const getVendorById = asyncWrapper(async (req, res) => {
  const vendor = await adminService.getVendorById(req.params.id);
  return res.status(200).json(new ApiResponse(200, { vendor }, 'Vendor details retrieved'));
});

export const updateVendorStatus = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;
  const vendor = await adminService.updateVendorStatus(id, status, req.user, reason);
  return res.status(200).json(new ApiResponse(200, { vendor }, `Vendor status updated to ${status}`));
});

export const getVendorDashboardCounters = asyncWrapper(async (req, res) => {
  const counters = await adminService.getVendorDashboardCounters();
  return res.status(200).json(new ApiResponse(200, { counters }, 'Vendor dashboard counters retrieved'));
});

export const verifyVendorDocument = asyncWrapper(async (req, res) => {
  const { id, docType } = req.params;
  const { status, reason } = req.body;
  const kyc = await adminService.verifyVendorDocument(id, docType, status, reason, req.user);
  return res.status(200).json(new ApiResponse(200, { kyc }, `Document ${docType} status updated to ${status}`));
});

export const verifyVendorBank = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;
  const bank = await adminService.verifyVendorBank(id, status, reason, req.user);
  return res.status(200).json(new ApiResponse(200, { bank }, `Bank status updated to ${status}`));
});

export const getAdminNotes = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const notes = await adminService.getAdminNotes(id);
  return res.status(200).json(new ApiResponse(200, { notes }, `Admin notes retrieved`));
});

export const createAdminNote = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  const adminNote = await adminService.createAdminNote(id, note, req.user);
  return res.status(201).json(new ApiResponse(201, { note: adminNote }, `Admin note created`));
});

// 5. Shop Management
export const getShops = asyncWrapper(async (req, res) => {
  const result = await adminService.getShops(req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Shops retrieved'));
});

export const getShopById = asyncWrapper(async (req, res) => {
  const shop = await adminService.getShopById(req.params.id);
  return res.status(200).json(new ApiResponse(200, { shop }, 'Shop details retrieved'));
});

export const updateShopStatus = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const shop = await adminService.updateShopStatus(id, status, req.user, req.ip);
  return res.status(200).json(new ApiResponse(200, { shop }, `Shop status updated to ${status}`));
});

// 6. Franchise Management
export const getFranchises = asyncWrapper(async (req, res) => {
  const result = await adminService.getFranchises(req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Franchises retrieved'));
});

export const getFranchiseById = asyncWrapper(async (req, res) => {
  const franchise = await adminService.getFranchiseById(req.params.id);
  return res.status(200).json(new ApiResponse(200, { franchise }, 'Franchise details retrieved'));
});

export const updateFranchiseStatus = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const franchise = await adminService.updateFranchiseStatus(id, status, req.user, req.ip);
  return res.status(200).json(new ApiResponse(200, { franchise }, `Franchise status updated to ${status}`));
});

// 7. Product Management
export const getAdminProducts = asyncWrapper(async (req, res) => {
  const result = await productService.getAdminProducts(req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Products retrieved'));
});

export const getProductById = asyncWrapper(async (req, res) => {
  const product = await adminService.getProductById(req.params.id);
  return res.status(200).json(new ApiResponse(200, { product }, 'Product details retrieved'));
});

export const approveProduct = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const product = await productService.updateProductStatus(id, 'APPROVED', '', req.user._id, req.ip);
  return res.status(200).json(new ApiResponse(200, { product }, `Product approved`));
});

export const rejectProduct = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  if (!reason) throw new ApiError(400, 'Rejection reason is required', ERROR_CODES.BAD_REQUEST);
  const product = await productService.updateProductStatus(id, 'REJECTED', reason, req.user._id, req.ip);
  return res.status(200).json(new ApiResponse(200, { product }, `Product rejected`));
});

// 8. Order Management
export const getOrders = asyncWrapper(async (req, res) => {
  const result = await adminService.getOrders(req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Orders retrieved'));
});

export const getOrderById = asyncWrapper(async (req, res) => {
  const result = await adminService.getOrderById(req.params.id);
  return res.status(200).json(new ApiResponse(200, result, 'Order details retrieved'));
});

// 9. Payment Management
export const getPayments = asyncWrapper(async (req, res) => {
  const result = await adminService.getPayments(req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Payments retrieved'));
});

export const getPaymentById = asyncWrapper(async (req, res) => {
  const payment = await adminService.getPaymentById(req.params.id);
  return res.status(200).json(new ApiResponse(200, { payment }, 'Payment details retrieved'));
});

// 10. KYC Management
export const getKycs = asyncWrapper(async (req, res) => {
  const result = await adminService.getKycs(req.query);
  return res.status(200).json(new ApiResponse(200, result, 'KYC records retrieved'));
});

export const getKycById = asyncWrapper(async (req, res) => {
  const kyc = await adminService.getKycById(req.params.id);
  return res.status(200).json(new ApiResponse(200, { kyc }, 'KYC details retrieved'));
});

export const updateKycStatus = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;
  const kyc = await adminService.updateKycStatus(id, status, rejectionReason, req.user, req.ip);
  return res.status(200).json(new ApiResponse(200, { kyc }, `KYC status updated to ${status}`));
});

// 11. Subscriptions
export const getAdminSubscriptions = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 10, status = '' } = req.query;
  const query = {};
  if (status) query.status = status;
  const skip = (page - 1) * limit;
  const subscriptions = await Subscription.find(query).populate('ownerUserId', 'name email').skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 });
  const total = await Subscription.countDocuments(query);
  return res.status(200).json(new ApiResponse(200, {
    subscriptions,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit)
  }, 'Subscriptions retrieved'));
});

export const getAdminSubscriptionById = asyncWrapper(async (req, res) => {
  const subscription = await Subscription.findById(req.params.id).populate('ownerUserId', 'name email').populate('planId');
  if (!subscription) throw new ApiError(404, 'Subscription not found', ERROR_CODES.NOT_FOUND);
  return res.status(200).json(new ApiResponse(200, { subscription }, 'Subscription details retrieved'));
});

export const getExpiringSubscriptions = asyncWrapper(async (req, res) => {
  const { days = 7 } = req.query;
  const limitDate = new Date();
  limitDate.setDate(limitDate.getDate() + parseInt(days));
  const subscriptions = await Subscription.find({
    status: 'ACTIVE',
    endDate: { $gte: new Date(), $lte: limitDate }
  }).populate('ownerUserId', 'name email');
  return res.status(200).json(new ApiResponse(200, { subscriptions }, 'Expiring subscriptions'));
});

// 12. Commissions
export const getCommissions = asyncWrapper(async (req, res) => {
  const result = await adminService.getCommissions(req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Commissions retrieved'));
});

export const getCommissionById = asyncWrapper(async (req, res) => {
  const commission = await adminService.getCommissionById(req.params.id);
  return res.status(200).json(new ApiResponse(200, { commission }, 'Commission details retrieved'));
});

// 13. Settlements
export const getSettlements = asyncWrapper(async (req, res) => {
  const result = await adminService.getSettlements(req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Settlements retrieved'));
});

export const getSettlementById = asyncWrapper(async (req, res) => {
  const settlement = await adminService.getSettlementById(req.params.id);
  return res.status(200).json(new ApiResponse(200, { settlement }, 'Settlement details retrieved'));
});

export const updateSettlementStatus = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;
  const settlement = await adminService.updateSettlementStatus(id, status, adminNotes, req.user, req.ip);
  return res.status(200).json(new ApiResponse(200, { settlement }, `Settlement status updated to ${status}`));
});

export const reverseSettlement = asyncWrapper(async (req, res) => {
  if (req.user.role !== 'SUPER_ADMIN') {
    throw new ApiError(403, 'Only SUPER_ADMIN can reverse settlements', ERROR_CODES.FORBIDDEN);
  }

  const { id } = req.params;
  const { reason } = req.body;

  const settlement = await VendorWithdrawal.findById(id);
  if (!settlement) throw new ApiError(404, 'Settlement not found', ERROR_CODES.NOT_FOUND);

  settlement.status = 'REJECTED';
  settlement.adminNotes = `Reversed by Super Admin. Reason: ${reason}`;
  await settlement.save();

  await AuditLog.create({
    userId: req.user._id,
    action: 'SETTLEMENT_REVERSED',
    entity: 'VendorWithdrawal',
    entityId: id,
    newValue: 'REJECTED',
    ipAddress: req.ip
  });

  return res.status(200).json(new ApiResponse(200, { settlement }, 'Settlement reversed successfully'));
});

// 14. Coupons
export const getCoupons = asyncWrapper(async (req, res) => {
  const result = await adminService.getCoupons(req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Coupons retrieved'));
});

export const createCoupon = asyncWrapper(async (req, res) => {
  const coupon = await adminService.createCoupon(req.body);
  return res.status(201).json(new ApiResponse(201, { coupon }, 'Coupon created successfully'));
});

export const updateCoupon = asyncWrapper(async (req, res) => {
  const coupon = await adminService.updateCoupon(req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, { coupon }, 'Coupon updated successfully'));
});

export const updateCouponStatus = asyncWrapper(async (req, res) => {
  const { isActive } = req.body;
  const coupon = await adminService.updateCouponStatus(req.params.id, isActive);
  return res.status(200).json(new ApiResponse(200, { coupon }, `Coupon status updated`));
});

// 15. Campaigns
export const getCampaigns = asyncWrapper(async (req, res) => {
  const result = await adminService.getCampaigns(req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Campaigns retrieved'));
});

export const createCampaign = asyncWrapper(async (req, res) => {
  const campaign = await adminService.createCampaign(req.body);
  return res.status(201).json(new ApiResponse(201, { campaign }, 'Campaign created successfully'));
});

export const updateCampaign = asyncWrapper(async (req, res) => {
  const campaign = await adminService.updateCampaign(req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, { campaign }, 'Campaign updated successfully'));
});

export const updateCampaignStatus = asyncWrapper(async (req, res) => {
  const { isActive } = req.body;
  const campaign = await adminService.updateCampaignStatus(req.params.id, isActive);
  return res.status(200).json(new ApiResponse(200, { campaign }, `Campaign status updated`));
});

// 16. Fulfillments
export const getFulfillments = asyncWrapper(async (req, res) => {
  const result = await adminService.getFulfillments(req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Fulfillments retrieved'));
});

export const getFulfillmentById = asyncWrapper(async (req, res) => {
  const fulfillment = await adminService.getFulfillmentById(req.params.id);
  return res.status(200).json(new ApiResponse(200, { fulfillment }, 'Fulfillment details retrieved'));
});

// 17. Deliveries
export const getDeliveries = asyncWrapper(async (req, res) => {
  const result = await adminService.getDeliveries(req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Deliveries retrieved'));
});

export const getDeliveryById = asyncWrapper(async (req, res) => {
  const delivery = await adminService.getDeliveryById(req.params.id);
  return res.status(200).json(new ApiResponse(200, { delivery }, 'Delivery details retrieved'));
});

// 18. Audit Logs search
export const getAuditLogs = asyncWrapper(async (req, res) => {
  const result = await adminService.getAuditLogsFiltered(req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Audit logs retrieved'));
});

// 19. Operational Alerts
export const getOperationalAlerts = asyncWrapper(async (req, res) => {
  const alerts = await adminService.getOperationalAlerts();
  return res.status(200).json(new ApiResponse(200, { alerts }, 'Operational alerts retrieved'));
});

// ----------------------------------------------------
// ANALYTICS CONTROLLERS (Supports UTC server-side Date Range Filters)
// ----------------------------------------------------

export const getRevenueAnalytics = asyncWrapper(async (req, res) => {
  const { startDate, endDate } = parseDateRange(req.query);
  const data = await adminService.getRevenueAnalytics(startDate, endDate);
  return res.status(200).json(new ApiResponse(200, data, 'Revenue analytics retrieved'));
});

export const getOrderAnalytics = asyncWrapper(async (req, res) => {
  const { startDate, endDate } = parseDateRange(req.query);
  const data = await adminService.getOrderAnalytics(startDate, endDate);
  return res.status(200).json(new ApiResponse(200, data, 'Order analytics retrieved'));
});

export const getCustomerAnalytics = asyncWrapper(async (req, res) => {
  const { startDate, endDate } = parseDateRange(req.query);
  const data = await adminService.getCustomerAnalytics(startDate, endDate);
  return res.status(200).json(new ApiResponse(200, data, 'Customer analytics retrieved'));
});

export const getVendorAnalytics = asyncWrapper(async (req, res) => {
  const { startDate, endDate } = parseDateRange(req.query);
  const data = await adminService.getVendorAnalytics(startDate, endDate);
  return res.status(200).json(new ApiResponse(200, data, 'Vendor analytics retrieved'));
});

export const getShopAnalytics = asyncWrapper(async (req, res) => {
  const { startDate, endDate } = parseDateRange(req.query);
  const data = await adminService.getShopAnalytics(startDate, endDate);
  return res.status(200).json(new ApiResponse(200, data, 'Shop analytics retrieved'));
});

export const getFranchiseAnalytics = asyncWrapper(async (req, res) => {
  const { startDate, endDate } = parseDateRange(req.query);
  const data = await adminService.getFranchiseAnalytics(startDate, endDate);
  return res.status(200).json(new ApiResponse(200, data, 'Franchise analytics retrieved'));
});

export const getKycAnalytics = asyncWrapper(async (req, res) => {
  const { startDate, endDate } = parseDateRange(req.query);
  const data = await adminService.getKycAnalytics(startDate, endDate);
  return res.status(200).json(new ApiResponse(200, data, 'KYC analytics retrieved'));
});

export const getSubscriptionAnalytics = asyncWrapper(async (req, res) => {
  const { startDate, endDate } = parseDateRange(req.query);
  const data = await adminService.getSubscriptionAnalytics(startDate, endDate);
  return res.status(200).json(new ApiResponse(200, data, 'Subscription analytics retrieved'));
});

export const getCommissionAnalytics = asyncWrapper(async (req, res) => {
  const { startDate, endDate } = parseDateRange(req.query);
  const data = await adminService.getCommissionAnalytics(startDate, endDate);
  return res.status(200).json(new ApiResponse(200, data, 'Commission analytics retrieved'));
});

export const getSettlementAnalytics = asyncWrapper(async (req, res) => {
  const { startDate, endDate } = parseDateRange(req.query);
  const data = await adminService.getSettlementAnalytics(startDate, endDate);
  return res.status(200).json(new ApiResponse(200, data, 'Settlement analytics retrieved'));
});

export const getFairCoinAnalytics = asyncWrapper(async (req, res) => {
  const { startDate, endDate } = parseDateRange(req.query);
  const data = await adminService.getFairCoinAnalytics(startDate, endDate);
  return res.status(200).json(new ApiResponse(200, data, 'Fair Coin analytics retrieved'));
});

export const getProductAnalytics = asyncWrapper(async (req, res) => {
  const { startDate, endDate } = parseDateRange(req.query);
  const data = await adminService.getProductAnalytics(startDate, endDate);
  return res.status(200).json(new ApiResponse(200, data, 'Product analytics retrieved'));
});

export const getCouponAnalytics = asyncWrapper(async (req, res) => {
  const { startDate, endDate } = parseDateRange(req.query);
  const data = await adminService.getCouponAnalytics(startDate, endDate);
  return res.status(200).json(new ApiResponse(200, data, 'Coupon analytics retrieved'));
});

export const getCampaignAnalytics = asyncWrapper(async (req, res) => {
  const { startDate, endDate } = parseDateRange(req.query);
  const data = await adminService.getCampaignAnalytics(startDate, endDate);
  return res.status(200).json(new ApiResponse(200, data, 'Campaign analytics retrieved'));
});

export const getFulfillmentAnalytics = asyncWrapper(async (req, res) => {
  const { startDate, endDate } = parseDateRange(req.query);
  const data = await adminService.getFulfillmentAnalytics(startDate, endDate);
  return res.status(200).json(new ApiResponse(200, data, 'Fulfillment analytics retrieved'));
});

export const getDeliveryAnalytics = asyncWrapper(async (req, res) => {
  const { startDate, endDate } = parseDateRange(req.query);
  const data = await adminService.getDeliveryAnalytics(startDate, endDate);
  return res.status(200).json(new ApiResponse(200, data, 'Delivery analytics retrieved'));
});

// ----------------------------------------------------
// CSV EXPORT CONTROLLERS (High Performance Streaming)
// ----------------------------------------------------

export const exportOrdersCsv = asyncWrapper(async (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
  res.write('Order Number,Buyer,Subtotal,Discount,Coins Used,Shipping Fee,Total,Status,Payment Status,Date\n');
  const cursor = Order.find().populate('userId', 'name email').cursor();
  for (let order = await cursor.next(); order != null; order = await cursor.next()) {
    const row = [
      order.orderNumber,
      `"${order.userId?.name || 'Deleted User'} (${order.userId?.email || 'N/A'})"`,
      order.subtotal,
      order.discount,
      order.fairCoinsUsed,
      order.shippingFee,
      order.total,
      order.orderStatus,
      order.paymentStatus,
      order.createdAt.toISOString()
    ].join(',');
    res.write(row + '\n');
  }
  res.end();
});

export const exportPaymentsCsv = asyncWrapper(async (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=payments.csv');
  res.write('Transaction ID,User,Amount,Currency,Method,Status,Verified At,Date\n');
  const cursor = Payment.find().populate('userId', 'name email').cursor();
  for (let pay = await cursor.next(); pay != null; pay = await cursor.next()) {
    const row = [
      pay.transactionId,
      `"${pay.userId?.name || 'Deleted User'} (${pay.userId?.email || 'N/A'})"`,
      pay.amount,
      pay.currency,
      pay.paymentMethod,
      pay.status,
      pay.verifiedAt ? pay.verifiedAt.toISOString() : 'N/A',
      pay.createdAt.toISOString()
    ].join(',');
    res.write(row + '\n');
  }
  res.end();
});

export const exportCommissionsCsv = asyncWrapper(async (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=commissions.csv');
  res.write('Order ID,Recipient,Type,Order Amount,Percentage,Commission Amount,Status,Date\n');
  const cursor = Commission.find().populate('recipientUserId', 'name email').cursor();
  for (let comm = await cursor.next(); comm != null; comm = await cursor.next()) {
    const row = [
      comm.orderId,
      `"${comm.recipientUserId?.name || 'Deleted User'} (${comm.recipientUserId?.email || 'N/A'})"`,
      comm.type,
      comm.orderAmount,
      comm.commissionPercentage,
      comm.commissionAmount,
      comm.status,
      comm.createdAt.toISOString()
    ].join(',');
    res.write(row + '\n');
  }
  res.end();
});

export const exportSettlementsCsv = asyncWrapper(async (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=settlements.csv');
  res.write('Withdrawal ID,Vendor,Amount,Status,Processed At,Date\n');
  const cursor = VendorWithdrawal.find().populate({ path: 'vendorId', populate: { path: 'userId' } }).cursor();
  for (let set = await cursor.next(); set != null; set = await cursor.next()) {
    const row = [
      set._id,
      `"${set.vendorId?.storeName || 'N/A'} (${set.vendorId?.userId?.email || 'N/A'})"`,
      set.amount,
      set.status,
      set.processedAt ? set.processedAt.toISOString() : 'N/A',
      set.createdAt.toISOString()
    ].join(',');
    res.write(row + '\n');
  }
  res.end();
});

export const exportUsersCsv = asyncWrapper(async (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
  res.write('User ID,Name,Email,Phone,Role,Status,Fair Coins,Created At\n');
  const cursor = User.find().cursor();
  for (let user = await cursor.next(); user != null; user = await cursor.next()) {
    const row = [
      user._id,
      `"${user.name}"`,
      user.email,
      user.phone || 'N/A',
      user.role,
      user.status,
      user.fairCoinBalance,
      user.createdAt.toISOString()
    ].join(',');
    res.write(row + '\n');
  }
  res.end();
});

export const getShopAttributions = asyncWrapper(async (req, res) => {
  const attributions = await adminService.getShopAttributions(req.query);
  return res.status(200).json(new ApiResponse(200, attributions, 'Shop attributions retrieved'));
});

// Subscription Management

export const getAdminVendorSubscriptions = asyncWrapper(async (req, res) => {
  const { vendorId, planId, billingCycle, status, limit = 10, page = 1 } = req.query;
  const query = { entityType: 'VENDOR' };
  
  if (vendorId) query.entityId = vendorId;
  if (planId) query.planId = planId;
  if (billingCycle) query.billingCycle = billingCycle;
  if (status) query.status = status;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const subscriptions = await Subscription.find(query)
    .populate('entityId', 'storeName name email phone')
    .populate('planId', 'name monthlyPrice yearlyPrice')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
    
  const total = await Subscription.countDocuments(query);
  
  return res.status(200).json(new ApiResponse(200, {
    subscriptions,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    }
  }, 'Admin subscriptions retrieved'));
});

export const getExpiringVendorSubscriptions = asyncWrapper(async (req, res) => {
  const { days = 30 } = req.query;
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + parseInt(days));
  
  const subscriptions = await Subscription.find({
    entityType: 'VENDOR',
    status: 'ACTIVE',
    endDate: { $lte: futureDate, $gte: new Date() }
  })
    .populate('entityId', 'storeName name email phone')
    .populate('planId', 'name');
    
  return res.status(200).json(new ApiResponse(200, { subscriptions }, 'Expiring subscriptions retrieved'));
});

export const getAdminVendorSubscriptionById = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const subscription = await Subscription.findById(id)
    .populate('entityId', 'storeName name email phone')
    .populate('planId', 'name monthlyPrice yearlyPrice features')
    .populate('paymentId');
    
  if (!subscription) {
    throw new ApiError(404, 'Subscription not found');
  }
  
  return res.status(200).json(new ApiResponse(200, { subscription }, 'Subscription retrieved'));
});

// Vendor Area Assignments

export const getVendorArea = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { VendorAreaAssignment } = await import('../models/VendorAreaAssignment.js');
  
  const assignment = await VendorAreaAssignment.findOne({ vendorId: id, status: 'ACTIVE' })
    .populate('stateId')
    .populate('districtId')
    .populate('areaId')
    .populate('assignedBy', 'name email role');
    
  return res.status(200).json(new ApiResponse(200, { assignment }, 'Vendor area assignment retrieved'));
});

export const assignVendorArea = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { stateId, districtId, areaId, pincode } = req.body;
  
  const { Territory } = await import('../models/Territory.js');
  const { VendorAreaAssignment } = await import('../models/VendorAreaAssignment.js');
  const { AuditLog } = await import('../models/AuditLog.js');
  const { Vendor } = await import('../models/Vendor.js');
  const { territoryAccessService } = await import('../services/territoryAccessService.js');
  
  // Validate Vendor
  const vendor = await Vendor.findById(id);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  // Check hierarchy validation
  const area = await Territory.findById(areaId);
  const district = await Territory.findById(districtId);
  const state = await Territory.findById(stateId);
  
  if (!area || !district || !state) {
    throw new ApiError(400, 'Invalid geographical entities');
  }
  
  if (area.parentTerritory.toString() !== district._id.toString() || district.parentTerritory.toString() !== state._id.toString()) {
    throw new ApiError(400, 'Geographical hierarchy mismatch');
  }

  // Deactivate old assignments
  await VendorAreaAssignment.updateMany(
    { vendorId: id, status: 'ACTIVE' },
    { status: 'INACTIVE' }
  );

  const assignment = new VendorAreaAssignment({
    vendorId: id,
    stateId,
    districtId,
    areaId,
    pincode,
    assignedBy: req.user._id
  });
  await assignment.save();
  
  vendor.currentAreaAssignment = assignment._id;
  await vendor.save();
  
  await AuditLog.create({
    userId: req.user._id,
    action: 'VENDOR_AREA_ASSIGNED',
    entity: 'Vendor',
    entityId: id,
    newValue: { stateId, districtId, areaId, pincode },
    ipAddress: '127.0.0.1'
  });
  
  return res.status(200).json(new ApiResponse(200, { assignment }, 'Vendor area assigned successfully'));
});
