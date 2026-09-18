import { CustomerVendorAttribution } from '../models/CustomerVendorAttribution.js';
import { AttributionChangeRequest } from '../models/AttributionChangeRequest.js';
import { AttributionHistory } from '../models/AttributionHistory.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const getMyAttribution = asyncWrapper(async (req, res) => {
  const attribution = await CustomerVendorAttribution.findOne({ customerUserId: req.user._id, isPrimary: true, status: 'ACTIVE' })
    .populate('vendorId', 'storeName logo');

  return res.status(200).json(new ApiResponse(200, { attribution }, 'Current attribution retrieved'));
});

export const getMyAttributionHistory = asyncWrapper(async (req, res) => {
  const history = await AttributionHistory.find({ customerId: req.user._id })
    .populate('previousVendorId', 'storeName')
    .populate('newVendorId', 'storeName')
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, { history }, 'Attribution history retrieved'));
});

export const requestAttributionChange = asyncWrapper(async (req, res) => {
  const { requestedVendorId, reason } = req.body;
  if (!requestedVendorId || !reason) throw new ApiError(400, 'requestedVendorId and reason are required', ERROR_CODES.BAD_REQUEST);

  const currentAttribution = await CustomerVendorAttribution.findOne({ customerUserId: req.user._id, isPrimary: true, status: 'ACTIVE' });

  const request = await AttributionChangeRequest.create({
    customerId: req.user._id,
    currentVendorId: currentAttribution ? currentAttribution.vendorId : null,
    requestedVendorId,
    reason,
    status: 'PENDING'
  });

  return res.status(201).json(new ApiResponse(201, { request }, 'Change request submitted successfully'));
});
