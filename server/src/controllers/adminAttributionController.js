import { CustomerVendorAttribution } from '../models/CustomerVendorAttribution.js';
import { AttributionHistory } from '../models/AttributionHistory.js';
import { vendorReferralService } from '../services/vendorReferralService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const getAllAttributions = asyncWrapper(async (req, res) => {
  const attributions = await CustomerVendorAttribution.find({ isPrimary: true })
    .populate('customerUserId', 'name email')
    .populate('vendorId', 'storeName')
    .sort({ attributedAt: -1 });

  return res.status(200).json(new ApiResponse(200, { attributions }, 'Attributions retrieved'));
});

export const manuallyAssignVendor = asyncWrapper(async (req, res) => {
  const { customerId, vendorId, reason } = req.body;
  
  if (!customerId || !vendorId || !reason) {
    throw new ApiError(400, 'customerId, vendorId, and reason are required', ERROR_CODES.BAD_REQUEST);
  }

  const attribution = await vendorReferralService.manuallyAssignVendor(customerId, vendorId, req.user._id, reason);

  return res.status(200).json(new ApiResponse(200, { attribution }, 'Customer manually assigned to vendor'));
});

export const revokeAttribution = asyncWrapper(async (req, res) => {
  const attribution = await CustomerVendorAttribution.findById(req.params.id);
  if (!attribution) throw new ApiError(404, 'Attribution not found', ERROR_CODES.NOT_FOUND);

  attribution.isPrimary = false;
  attribution.status = 'REVOKED';
  await attribution.save();

  await AttributionHistory.create({
    customerId: attribution.customerUserId,
    previousVendorId: attribution.vendorId,
    newVendorId: null,
    source: 'ADMIN_ASSIGNMENT',
    reason: req.body.reason || 'Admin revoked attribution',
    changedBy: req.user._id
  });

  return res.status(200).json(new ApiResponse(200, { attribution }, 'Attribution revoked'));
});
