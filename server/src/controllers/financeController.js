import { VendorSettlement } from '../models/VendorSettlement.js';
import { VendorLedger } from '../models/VendorLedger.js';
import { Vendor } from '../models/Vendor.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const getAdminSettlements = asyncWrapper(async (req, res) => {
  const { status, vendorId, page = 1, limit = 20 } = req.query;
  const query = {};
  
  if (status) query.status = status;
  if (vendorId) query.vendorId = vendorId;

  const skip = (page - 1) * limit;
  
  const settlements = await VendorSettlement.find(query)
    .populate('vendorId', 'storeName businessName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await VendorSettlement.countDocuments(query);

  return res.status(200).json(new ApiResponse(200, {
    settlements,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit)
  }, 'Admin settlements retrieved'));
});

export const markSettlementPaid = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { payoutReference, notes } = req.body;

  const settlement = await VendorSettlement.findById(id);
  
  if (!settlement) {
    throw new ApiError(404, 'Settlement not found', ERROR_CODES.NOT_FOUND);
  }

  if (settlement.status !== 'ELIGIBLE') {
    throw new ApiError(400, `Settlement cannot be paid. Current status: ${settlement.status}`, ERROR_CODES.BAD_REQUEST);
  }

  // Check bank account verification theoretically
  const vendor = await Vendor.findById(settlement.vendorId);
  // Assuming vendor.bankDetails.status would be checked here in real implementation

  settlement.status = 'PAID';
  settlement.paidAt = new Date();
  settlement.payoutReference = payoutReference || '';
  settlement.notes = notes || '';
  
  await settlement.save();

  // Create Payout Ledger Entry
  const newVendorBalance = vendor.balance - settlement.netPayable; // Since netPayable is debited from their internal balance upon payout
  
  await VendorLedger.create({
    vendorId: vendor._id,
    suborderId: settlement.suborderId,
    transactionType: 'PAYOUT',
    credit: 0,
    debit: settlement.netPayable,
    balanceSnapshot: newVendorBalance,
    description: `Payout for settlement ${settlement._id}`,
    referenceId: payoutReference
  });

  vendor.balance = newVendorBalance;
  await vendor.save();

  return res.status(200).json(new ApiResponse(200, { settlement }, 'Settlement marked as paid'));
});

export const getVendorSettlements = asyncWrapper(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id });
  if (!vendor) throw new ApiError(404, 'Vendor profile not found', ERROR_CODES.NOT_FOUND);

  const { status, page = 1, limit = 20 } = req.query;
  const query = { vendorId: vendor._id };
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const settlements = await VendorSettlement.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  const total = await VendorSettlement.countDocuments(query);

  return res.status(200).json(new ApiResponse(200, {
    settlements,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit)
  }, 'Vendor settlements retrieved'));
});

export const getVendorLedger = asyncWrapper(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id });
  if (!vendor) throw new ApiError(404, 'Vendor profile not found', ERROR_CODES.NOT_FOUND);

  const { page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const ledger = await VendorLedger.find({ vendorId: vendor._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await VendorLedger.countDocuments({ vendorId: vendor._id });

  return res.status(200).json(new ApiResponse(200, {
    ledger,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit)
  }, 'Vendor ledger retrieved'));
});
