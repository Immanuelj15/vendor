import { VendorReferralCode } from '../models/VendorReferralCode.js';
import { CustomerVendorAttribution } from '../models/CustomerVendorAttribution.js';
import { ReferralEvent } from '../models/ReferralEvent.js';
import { AttributionHistory } from '../models/AttributionHistory.js';
import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const vendorReferralService = {
  async resolveVendorByCode(code) {
    const referralCode = await VendorReferralCode.findOne({ code: code.toUpperCase(), status: 'ACTIVE' }).populate('vendorId');
    if (!referralCode) return null;
    if (referralCode.vendorId.status !== 'APPROVED') return null; // Only approved/active vendors can recruit
    return referralCode;
  },

  async logReferralEvent({ vendorId, customerId = null, referralCodeId = null, eventType, sessionReference = '', sourceCode = '' }) {
    await ReferralEvent.create({
      vendorId,
      customerId,
      referralCodeId,
      eventType,
      sessionReference,
      sourceCode
    });
  },

  async createPrimaryAttribution(customerId, vendorId, source, sourceCode, session = null) {
    // FIRST-TOUCH POLICY: Ensure no active primary attribution exists
    const existing = await CustomerVendorAttribution.findOne({ customerUserId: customerId, isPrimary: true }).session(session);
    if (existing) {
      // Log event, but do not reassign
      await this.logReferralEvent({ vendorId, customerId, eventType: 'REGISTRATION_COMPLETED', sourceCode });
      return existing;
    }

    const attribution = new CustomerVendorAttribution({
      customerUserId: customerId,
      vendorId,
      source,
      sourceCode,
      status: 'ACTIVE',
      isPrimary: true,
      attributedAt: new Date()
    });
    
    await attribution.save({ session });

    await User.findByIdAndUpdate(customerId, { attributedVendorId: vendorId }, { session });

    await AttributionHistory.create([{
      customerId,
      previousVendorId: null,
      newVendorId: vendorId,
      source,
      reason: 'Initial Registration First-Touch',
      changedBy: null
    }], { session });

    await this.logReferralEvent({ vendorId, customerId, eventType: 'ATTRIBUTION_CREATED', sourceCode });

    return attribution;
  },

  async manuallyAssignVendor(customerId, newVendorId, adminId, reason) {
    const customer = await User.findById(customerId);
    const vendor = await Vendor.findById(newVendorId);
    
    if (!customer || !vendor) {
      throw new ApiError(404, 'Customer or Vendor not found', ERROR_CODES.NOT_FOUND);
    }

    const currentAttribution = await CustomerVendorAttribution.findOne({ customerUserId: customerId, isPrimary: true });
    
    if (currentAttribution && currentAttribution.vendorId.toString() === newVendorId.toString()) {
      throw new ApiError(400, 'Customer is already assigned to this vendor', ERROR_CODES.BAD_REQUEST);
    }

    // Revoke old
    let previousVendorId = null;
    if (currentAttribution) {
      previousVendorId = currentAttribution.vendorId;
      currentAttribution.isPrimary = false;
      currentAttribution.status = 'REVOKED';
      await currentAttribution.save();
    }

    // Create new
    const newAttribution = await CustomerVendorAttribution.create({
      customerUserId: customerId,
      vendorId: newVendorId,
      source: 'ADMIN_ASSIGNMENT',
      status: 'ACTIVE',
      isPrimary: true,
      attributedAt: new Date()
    });

    await User.findByIdAndUpdate(customerId, { attributedVendorId: newVendorId });

    await AttributionHistory.create({
      customerId,
      previousVendorId,
      newVendorId,
      source: 'ADMIN_ASSIGNMENT',
      reason,
      changedBy: adminId
    });

    return newAttribution;
  }
};
