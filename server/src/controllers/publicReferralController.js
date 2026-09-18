import { vendorReferralService } from '../services/vendorReferralService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const handleQRScan = asyncWrapper(async (req, res) => {
  const { referralCode } = req.params;

  const vendorRef = await vendorReferralService.resolveVendorByCode(referralCode);
  if (!vendorRef) {
    throw new ApiError(404, 'Invalid or inactive referral code', ERROR_CODES.NOT_FOUND);
  }

  // Log anonymous scan event
  await vendorReferralService.logReferralEvent({
    vendorId: vendorRef.vendorId._id,
    referralCodeId: vendorRef._id,
    eventType: 'QR_SCANNED',
    sourceCode: referralCode
  });

  return res.status(200).json(new ApiResponse(200, { 
    vendor: {
      id: vendorRef.vendorId._id,
      storeName: vendorRef.vendorId.storeName,
      logo: vendorRef.vendorId.logo,
    },
    referralCode
  }, 'Vendor resolved'));
});
