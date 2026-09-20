import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { VendorBusiness } from '../models/VendorBusiness.js';
import { VendorAddress } from '../models/VendorAddress.js';
import { VendorDocument } from '../models/VendorDocument.js';
import { VendorBankAccount } from '../models/VendorBankAccount.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import { tokenService } from './tokenService.js';
import { ROLES } from '../constants/roles.js';

export const vendorOnboardingService = {
  async register(reqBody) {
    const { 
      name, email, phone, password, 
      storeName, description, businessType, gstNumber, panNumber,
      state, district, talukArea, pincode, fullAddress,
      identityDocumentType, identityDocumentNumber, identityDocumentUpload, panDocumentUpload,
      accountHolderName, bankName, accountNumber, ifscCode,
      termsAccepted
    } = reqBody;

    if (!termsAccepted) {
      throw new ApiError(400, 'Terms and Conditions must be accepted', ERROR_CODES.BAD_REQUEST);
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, ...(phone ? [{ phone }] : [])],
    });

    if (existingUser) {
      throw new ApiError(400, 'Email or Phone is already registered', ERROR_CODES.CONFLICT);
    }

    try {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = new User({
        name,
        email: email.toLowerCase(),
        phone,
        passwordHash,
        role: ROLES.VENDOR,
      });
      await user.save();

      const slug = (storeName || name).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(7);

      const vendor = new Vendor({
        userId: user._id,
        storeName: storeName || name + " Store",
        slug,
        email: email.toLowerCase(),
        phone: phone || '',
        status: 'UNDER_REVIEW',
        termsAccepted: true,
        termsAcceptedAt: new Date()
      });
      await vendor.save();

      const business = new VendorBusiness({
        vendorId: vendor._id,
        storeName: storeName || name,
        description, businessType, gstNumber, panNumber
      });
      await business.save();

      const location = new VendorAddress({
        vendorId: vendor._id,
        state, district, talukArea, pincode, fullAddress
      });
      await location.save();

      const kyc = new VendorDocument({
        vendorId: vendor._id,
        identityDocumentType, identityDocumentNumber, identityDocumentUpload, panDocumentUpload
      });
      await kyc.save();

      const bank = new VendorBankAccount({
        vendorId: vendor._id,
        accountHolderName, bankName, accountNumber, ifscCode
      });
      await bank.save();

      const userResponse = user.toObject();
      delete userResponse.passwordHash;
      delete userResponse.refreshTokenHash;

      return { user: userResponse, vendor };
    } catch (err) {
      throw err;
    }
  },

  async getStatus(userId) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw new ApiError(404, 'Vendor not found', ERROR_CODES.NOT_FOUND);

    const business = await VendorBusiness.findOne({ vendorId: vendor._id });
    const location = await VendorAddress.findOne({ vendorId: vendor._id });
    const kyc = await VendorDocument.findOne({ vendorId: vendor._id });
    const bank = await VendorBankAccount.findOne({ vendorId: vendor._id });

    return {
      vendor,
      business,
      location,
      kyc,
      bank: bank ? (bank.toMaskedJSON ? bank.toMaskedJSON() : bank) : null,
    };
  },

  async submitBusiness(userId, payload) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw new ApiError(404, 'Vendor not found', ERROR_CODES.NOT_FOUND);
    if (vendor.status !== 'PENDING' && vendor.status !== 'REJECTED') {
      throw new ApiError(400, 'Cannot edit business info in current status', ERROR_CODES.BAD_REQUEST);
    }

    vendor.storeName = payload.storeName;
    vendor.description = payload.description || vendor.description;
    await vendor.save();

    let business = await VendorBusiness.findOne({ vendorId: vendor._id });
    if (business) {
      Object.assign(business, payload);
    } else {
      business = new VendorBusiness({ vendorId: vendor._id, ...payload });
    }
    await business.save();
    return business;
  },

  async submitLocation(userId, payload) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw new ApiError(404, 'Vendor not found', ERROR_CODES.NOT_FOUND);
    if (vendor.status !== 'PENDING' && vendor.status !== 'REJECTED') {
      throw new ApiError(400, 'Cannot edit location info in current status', ERROR_CODES.BAD_REQUEST);
    }

    let location = await VendorAddress.findOne({ vendorId: vendor._id });
    if (location) {
      Object.assign(location, payload);
    } else {
      location = new VendorAddress({ vendorId: vendor._id, ...payload });
    }
    await location.save();
    return location;
  },

  async submitKyc(userId, payload) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw new ApiError(404, 'Vendor not found', ERROR_CODES.NOT_FOUND);
    if (vendor.status !== 'PENDING' && vendor.status !== 'REJECTED') {
      throw new ApiError(400, 'Cannot edit KYC info in current status', ERROR_CODES.BAD_REQUEST);
    }

    let kyc = await VendorDocument.findOne({ vendorId: vendor._id });
    if (kyc) {
      Object.assign(kyc, payload);
    } else {
      kyc = new VendorDocument({ vendorId: vendor._id, ...payload });
    }
    await kyc.save();
    return kyc;
  },

  async submitBank(userId, payload) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw new ApiError(404, 'Vendor not found', ERROR_CODES.NOT_FOUND);
    if (vendor.status !== 'PENDING' && vendor.status !== 'REJECTED') {
      throw new ApiError(400, 'Cannot edit bank info in current status', ERROR_CODES.BAD_REQUEST);
    }

    let bank = await VendorBankAccount.findOne({ vendorId: vendor._id });
    if (bank) {
      Object.assign(bank, payload);
    } else {
      bank = new VendorBankAccount({ vendorId: vendor._id, ...payload });
    }
    await bank.save();
    return bank.toMaskedJSON ? bank.toMaskedJSON() : bank;
  },

  async submitFinal(userId, payload) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw new ApiError(404, 'Vendor not found', ERROR_CODES.NOT_FOUND);
    if (vendor.status !== 'PENDING') {
      throw new ApiError(400, 'Onboarding already submitted', ERROR_CODES.BAD_REQUEST);
    }
    
    if (!payload.termsAccepted) {
        throw new ApiError(400, 'Terms and Conditions must be accepted', ERROR_CODES.BAD_REQUEST);
    }

    vendor.termsAccepted = true;
    vendor.termsAcceptedAt = new Date();
    vendor.status = 'UNDER_REVIEW';
    await vendor.save();

    return vendor;
  },

  async resubmit(userId, payload) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw new ApiError(404, 'Vendor not found', ERROR_CODES.NOT_FOUND);
    if (vendor.status !== 'REJECTED') {
      throw new ApiError(400, 'Only rejected applications can be resubmitted', ERROR_CODES.BAD_REQUEST);
    }

    vendor.status = 'UNDER_REVIEW';
    await vendor.save();

    return vendor;
  }
};
