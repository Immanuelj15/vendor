import { VendorReferralCode } from '../models/VendorReferralCode.js';
import { CustomerVendorAttribution } from '../models/CustomerVendorAttribution.js';
import { ReferralEvent } from '../models/ReferralEvent.js';
import { Vendor } from '../models/Vendor.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import crypto from 'crypto';

export const getMyReferralInfo = asyncWrapper(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id });
  if (!vendor) throw new ApiError(404, 'Vendor profile not found', ERROR_CODES.NOT_FOUND);

  let referralCode = await VendorReferralCode.findOne({ vendorId: vendor._id, isPrimary: true });
  
  if (!referralCode) {
    // Generate one if it doesn't exist
    const code = `VEND-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    referralCode = await VendorReferralCode.create({
      vendorId: vendor._id,
      code,
      isPrimary: true
    });
  }

  // Analytics
  const scans = await ReferralEvent.countDocuments({ vendorId: vendor._id, eventType: 'QR_SCANNED' });
  const registrations = await ReferralEvent.countDocuments({ vendorId: vendor._id, eventType: 'REGISTRATION_COMPLETED' });
  const attributedCustomers = await CustomerVendorAttribution.countDocuments({ vendorId: vendor._id, isPrimary: true, status: 'ACTIVE' });

  return res.status(200).json(new ApiResponse(200, { 
    referralCode,
    analytics: { scans, registrations, attributedCustomers }
  }, 'Vendor referral info retrieved'));
});

export const getMyAttributedCustomers = asyncWrapper(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id });
  if (!vendor) throw new ApiError(404, 'Vendor profile not found', ERROR_CODES.NOT_FOUND);

  const customers = await CustomerVendorAttribution.find({ vendorId: vendor._id, isPrimary: true, status: 'ACTIVE' })
    .populate('customerUserId', 'name createdAt')
    .sort({ attributedAt: -1 });

  return res.status(200).json(new ApiResponse(200, { customers }, 'Attributed customers retrieved'));
});
