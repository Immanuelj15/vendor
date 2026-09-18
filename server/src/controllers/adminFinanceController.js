import { Order } from '../models/Order.js';
import { Commission } from '../models/Commission.js';
import { VendorSettlement } from '../models/VendorSettlement.js';
import { FinanceException } from '../models/FinanceException.js';
import { FinanceAdjustment } from '../models/FinanceAdjustment.js';
import { VendorLedger } from '../models/VendorLedger.js';
import { Payment } from '../models/Payment.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import { parseDateRange } from './adminController.js';
import { settlementService } from '../services/settlementService.js';

export const processSettlements = asyncWrapper(async (req, res) => {
  const result = await settlementService.processEligibleSettlements(req.user._id, req.ip);
  return res.status(200).json(new ApiResponse(200, result, 'Settlements processed'));
});

export const getFinanceDashboard = asyncWrapper(async (req, res) => {
  const { startDate, endDate } = parseDateRange(req.query);

  // 1. Gross Sales (from Orders)
  const salesResult = await Order.aggregate([
    { $match: { paymentStatus: 'PAID', createdAt: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: null, grossSales: { $sum: '$itemsSubtotal' }, totalOrders: { $sum: 1 } } }
  ]);

  // 2. Platform Commission
  const commResult = await Commission.aggregate([
    { $match: { type: 'PLATFORM_COMMISSION', createdAt: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: null, totalCommission: { $sum: '$commissionAmount' } } }
  ]);

  // 3. Network Commission
  const netCommResult = await Commission.aggregate([
    { $match: { type: 'NETWORK_COMMISSION', createdAt: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: null, totalNetworkCommission: { $sum: '$commissionAmount' } } }
  ]);

  // 4. Settlement Stats
  const settlementStats = await VendorSettlement.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: '$status',
        totalAmount: { $sum: '$netPayable' },
        count: { $sum: 1 }
      }
    }
  ]);

  const stats = {
    grossSales: salesResult[0]?.grossSales || 0,
    totalOrders: salesResult[0]?.totalOrders || 0,
    platformCommission: commResult[0]?.totalCommission || 0,
    networkCommission: netCommResult[0]?.totalNetworkCommission || 0,
    settlements: settlementStats.reduce((acc, curr) => {
      acc[curr._id] = { amount: curr.totalAmount, count: curr.count };
      return acc;
    }, {})
  };

  return res.status(200).json(new ApiResponse(200, stats, 'Finance dashboard data retrieved'));
});

export const getPlatformRevenue = asyncWrapper(async (req, res) => {
  const { startDate, endDate } = parseDateRange(req.query);

  const revenue = await Payment.aggregate([
    { $match: { status: 'SUCCESS', createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: {
          $cond: [
            { $ne: ['$subscriptionId', null] }, 'VENDOR_SUBSCRIPTION',
            { $cond: [{ $ne: ['$customerSubscriptionId', null] }, 'CUSTOMER_PREMIUM', 'MARKETPLACE_SALE'] }
          ]
        },
        amount: { $sum: '$amount' }
      }
    }
  ]);

  const formattedRevenue = revenue.reduce((acc, curr) => {
    acc[curr._id] = curr.amount;
    return acc;
  }, { VENDOR_SUBSCRIPTION: 0, CUSTOMER_PREMIUM: 0, MARKETPLACE_SALE: 0 });

  return res.status(200).json(new ApiResponse(200, formattedRevenue, 'Platform revenue retrieved'));
});

export const getExceptions = asyncWrapper(async (req, res) => {
  const { status = 'OPEN' } = req.query;
  const exceptions = await FinanceException.find({ status }).sort({ createdAt: -1 }).populate('referenceId');
  return res.status(200).json(new ApiResponse(200, { exceptions }, 'Finance exceptions retrieved'));
});

export const createAdjustment = asyncWrapper(async (req, res) => {
  const { vendorId, amount, reason } = req.body;
  if (!vendorId || !amount || !reason) {
    throw new ApiError(400, 'Vendor, amount, and reason are required', ERROR_CODES.BAD_REQUEST);
  }

  // Auto-approve if SUPER_ADMIN, else PENDING_APPROVAL
  const status = req.user.role === 'SUPER_ADMIN' ? 'APPROVED' : 'PENDING_APPROVAL';

  const adjustment = await FinanceAdjustment.create({
    vendorId,
    amount,
    reason,
    status,
    createdBy: req.user._id,
    approvedBy: status === 'APPROVED' ? req.user._id : null,
    approvedAt: status === 'APPROVED' ? new Date() : null
  });

  if (status === 'APPROVED') {
    // Determine latest balance
    const lastLedger = await VendorLedger.findOne({ vendorId }).sort({ createdAt: -1 });
    const currentBalance = lastLedger ? lastLedger.balanceSnapshot : 0;
    const newBalance = currentBalance + amount;

    await VendorLedger.create({
      vendorId,
      transactionType: 'ADJUSTMENT',
      credit: amount > 0 ? amount : 0,
      debit: amount < 0 ? Math.abs(amount) : 0,
      balanceSnapshot: newBalance,
      description: `Manual Adjustment: ${reason}`,
      referenceId: adjustment._id.toString()
    });
  }

  return res.status(201).json(new ApiResponse(201, { adjustment }, 'Finance adjustment created'));
});
