import { VendorLedger } from '../models/VendorLedger.js';
import { VendorSettlement } from '../models/VendorSettlement.js';
import { Vendor } from '../models/Vendor.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { parseDateRange } from './adminController.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const getVendorStatement = asyncWrapper(async (req, res) => {
  const { startDate, endDate } = parseDateRange(req.query);
  const vendor = await Vendor.findOne({ userId: req.user._id });
  if (!vendor) throw new ApiError(404, 'Vendor profile not found', ERROR_CODES.NOT_FOUND);

  // Opening balance is the balance snapshot of the LAST ledger entry BEFORE startDate
  const lastEntryBeforeStart = await VendorLedger.findOne({
    vendorId: vendor._id,
    createdAt: { $lt: startDate }
  }).sort({ createdAt: -1 });
  const openingBalance = lastEntryBeforeStart ? lastEntryBeforeStart.balanceSnapshot : 0;

  // Transactions within period
  const transactions = await VendorLedger.find({
    vendorId: vendor._id,
    createdAt: { $gte: startDate, $lte: endDate }
  }).sort({ createdAt: 1 });

  let sales = 0;
  let commission = 0;
  let deductions = 0;
  let payouts = 0;

  transactions.forEach(t => {
    if (t.transactionType === 'SALE') sales += t.credit;
    else if (t.transactionType === 'PLATFORM_COMMISSION' || t.transactionType === 'NETWORK_COMMISSION') commission += t.debit;
    else if (t.transactionType === 'PAYOUT') payouts += t.debit;
    else if (t.transactionType === 'ADJUSTMENT') {
      if (t.debit > 0) deductions += t.debit;
      if (t.credit > 0) sales += t.credit;
    }
  });

  const closingBalance = transactions.length > 0 ? transactions[transactions.length - 1].balanceSnapshot : openingBalance;
  
  const statement = {
    period: { start: startDate, end: endDate },
    openingBalance,
    sales,
    commission,
    deductions,
    payouts,
    closingBalance,
    transactions
  };

  return res.status(200).json(new ApiResponse(200, statement, 'Vendor statement retrieved'));
});

export const getVendorSettlements = asyncWrapper(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id });
  if (!vendor) throw new ApiError(404, 'Vendor profile not found', ERROR_CODES.NOT_FOUND);

  const { status, page = 1, limit = 20 } = req.query;
  const query = { vendorId: vendor._id };
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const settlements = await VendorSettlement.find(query)
    .populate('suborderId', 'subOrderNumber itemsSubtotal')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await VendorSettlement.countDocuments(query);

  return res.status(200).json(new ApiResponse(200, {
    settlements,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    total
  }, 'Vendor settlements retrieved'));
});
