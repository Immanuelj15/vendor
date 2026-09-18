import { OfflineBill } from '../models/OfflineBill.js';
import { offlineBillService } from '../services/offlineBillService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const submitBill = asyncWrapper(async (req, res) => {
  const bill = await offlineBillService.submitBill(req.user._id, req.body);
  return res.status(201).json(new ApiResponse(201, { bill }, 'Offline bill submitted successfully'));
});

export const getMyBills = asyncWrapper(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const bills = await OfflineBill.find({ customerId: req.user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await OfflineBill.countDocuments({ customerId: req.user._id });

  return res.status(200).json(
    new ApiResponse(200, { bills, total, page, pages: Math.ceil(total / limit) }, 'Bills retrieved')
  );
});

export const getBillById = asyncWrapper(async (req, res) => {
  const bill = await OfflineBill.findOne({ _id: req.params.id, customerId: req.user._id });
  if (!bill) throw new ApiError(404, 'Bill not found', ERROR_CODES.NOT_FOUND);

  return res.status(200).json(new ApiResponse(200, { bill }, 'Bill detail retrieved'));
});
