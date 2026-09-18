import { OfflineBill } from '../models/OfflineBill.js';
import { BillRewardRule } from '../models/BillRewardRule.js';
import { offlineBillService } from '../services/offlineBillService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

// ---- Bills Management ----

export const getAllBills = asyncWrapper(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status) query.status = status;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const bills = await OfflineBill.find(query).populate('customerId', 'name email').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10));
  const total = await OfflineBill.countDocuments(query);

  return res.status(200).json(new ApiResponse(200, { bills, total }, 'Bills retrieved'));
});

export const getBillById = asyncWrapper(async (req, res) => {
  const bill = await OfflineBill.findById(req.params.id).populate('customerId', 'name email');
  if (!bill) throw new ApiError(404, 'Bill not found', ERROR_CODES.NOT_FOUND);

  return res.status(200).json(new ApiResponse(200, { bill }, 'Bill retrieved'));
});

export const approveBill = asyncWrapper(async (req, res) => {
  const result = await offlineBillService.approveBill(req.params.id, req.user._id);
  return res.status(200).json(new ApiResponse(200, result, 'Bill approved and reward issued'));
});

export const rejectBill = asyncWrapper(async (req, res) => {
  const { reason } = req.body;
  const bill = await offlineBillService.rejectBill(req.params.id, req.user._id, reason);
  return res.status(200).json(new ApiResponse(200, { bill }, 'Bill rejected'));
});

// ---- Reward Rules Management ----

export const getRewardRules = asyncWrapper(async (req, res) => {
  const rules = await BillRewardRule.find({}).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, { rules }, 'Reward rules retrieved'));
});

export const createRewardRule = asyncWrapper(async (req, res) => {
  // If active, deactivate others (assuming 1 active at a time for simplicity)
  if (req.body.status === 'ACTIVE') {
    await BillRewardRule.updateMany({}, { status: 'INACTIVE' });
  }
  const rule = await BillRewardRule.create(req.body);
  return res.status(201).json(new ApiResponse(201, { rule }, 'Reward rule created'));
});

export const updateRewardRule = asyncWrapper(async (req, res) => {
  if (req.body.status === 'ACTIVE') {
    await BillRewardRule.updateMany({ _id: { $ne: req.params.id } }, { status: 'INACTIVE' });
  }
  const rule = await BillRewardRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!rule) throw new ApiError(404, 'Rule not found', ERROR_CODES.NOT_FOUND);
  return res.status(200).json(new ApiResponse(200, { rule }, 'Reward rule updated'));
});
