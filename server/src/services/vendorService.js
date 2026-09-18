import { Vendor } from '../models/Vendor.js';
import { VendorOrder } from '../models/VendorOrder.js';
import { VendorWithdrawal } from '../models/VendorWithdrawal.js';
import { VendorBusiness } from '../models/VendorBusiness.js';
import { VendorAddress } from '../models/VendorAddress.js';
import { VendorDocument } from '../models/VendorDocument.js';
import { VendorBankAccount } from '../models/VendorBankAccount.js';
import { VendorStatusHistory } from '../models/VendorStatusHistory.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import { vendorSubscriptionService } from './vendorSubscriptionService.js';
import { VendorLedger } from '../models/VendorLedger.js';
import { Settings } from '../models/Settings.js';
import { moneyUtils } from '../utils/moneyUtils.js';

export const vendorService = {
  async registerVendor(userId, vendorData) {
    const existing = await Vendor.findOne({ userId });
    if (existing) {
      throw new ApiError(400, 'Vendor profile already exists for this account', ERROR_CODES.CONFLICT);
    }

    const slug = vendorData.storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const vendor = await Vendor.create({
      userId,
      ...vendorData,
      slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'PENDING', // Default to pending approval
    });

    return vendor;
  },

  async getVendorProfile(userId) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) {
      throw new ApiError(404, 'Vendor profile not found. Please register as a vendor first.', ERROR_CODES.NOT_FOUND);
    }
    const business = await VendorBusiness.findOne({ vendorId: vendor._id });
    const location = await VendorAddress.findOne({ vendorId: vendor._id }).populate('state district talukArea', 'name');
    const kyc = await VendorDocument.findOne({ vendorId: vendor._id });
    const bank = await VendorBankAccount.findOne({ vendorId: vendor._id });
    
    return { vendor, business, location, kyc, bank };
  },

  async updateVendorProfile(userId, payload) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw new ApiError(404, 'Vendor not found', ERROR_CODES.NOT_FOUND);
    
    if (payload.storeName) vendor.storeName = payload.storeName;
    if (payload.description) vendor.description = payload.description;
    await vendor.save();

    if (payload.business) {
      await VendorBusiness.findOneAndUpdate({ vendorId: vendor._id }, payload.business, { upsert: true });
    }
    if (payload.location) {
      await VendorAddress.findOneAndUpdate({ vendorId: vendor._id }, payload.location, { upsert: true });
    }

    // Changing sensitive fields should probably trigger re-verification.
    // For now, if they change GST/PAN, reset statuses:
    if (payload.business && (payload.business.gstNumber || payload.business.panNumber)) {
      await VendorBusiness.findOneAndUpdate({ vendorId: vendor._id }, { gstStatus: 'PENDING' });
      vendor.kycStatus = 'PENDING';
      vendor.status = 'UNDER_REVIEW'; // Needs review again
      await vendor.save();
    }

    return await this.getVendorProfile(userId);
  },

  async updateVendorDocuments(userId, docType, payload) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw new ApiError(404, 'Vendor not found', ERROR_CODES.NOT_FOUND);

    const kyc = await VendorDocument.findOne({ vendorId: vendor._id });
    if (!kyc) throw new ApiError(404, 'Documents not found', ERROR_CODES.NOT_FOUND);

    if (docType === 'identity') {
      kyc.identityDocumentUpload = payload.uploadUrl;
      kyc.identityDocumentStatus = 'PENDING';
      kyc.identityDocumentReason = '';
    } else if (docType === 'pan') {
      kyc.panDocumentUpload = payload.uploadUrl;
      kyc.panDocumentStatus = 'PENDING';
      kyc.panDocumentReason = '';
    } else if (docType === 'gst') {
      kyc.gstCertificateUpload = payload.uploadUrl;
      kyc.gstCertificateStatus = 'PENDING';
      kyc.gstCertificateReason = '';
    } else if (docType === 'business') {
      kyc.businessProofUpload = payload.uploadUrl;
      kyc.businessProofStatus = 'PENDING';
      kyc.businessProofReason = '';
    }

    await kyc.save();
    
    vendor.kycStatus = 'PENDING';
    vendor.status = 'UNDER_REVIEW';
    await vendor.save();

    return kyc;
  },

  async updateVendorBank(userId, payload) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw new ApiError(404, 'Vendor not found', ERROR_CODES.NOT_FOUND);

    let bank = await VendorBankAccount.findOne({ vendorId: vendor._id });
    if (!bank) {
      bank = new VendorBankAccount({ vendorId: vendor._id });
    }
    
    Object.assign(bank, payload);
    bank.verificationStatus = 'PENDING';
    bank.rejectionReason = '';
    await bank.save();
    
    vendor.status = 'UNDER_REVIEW';
    await vendor.save();
    
    return bank;
  },

  async getVendorStatusHistory(userId) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw new ApiError(404, 'Vendor not found', ERROR_CODES.NOT_FOUND);

    return await VendorStatusHistory.find({ vendorId: vendor._id })
      .populate('changedBy', 'name')
      .sort({ createdAt: -1 });
  },

  async getVendorDashboard(vendorId) {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) throw new ApiError(404, 'Vendor not found', ERROR_CODES.NOT_FOUND);

    const orders = await VendorOrder.find({ vendorId }).sort({ createdAt: -1 });
    const productsCount = await Product.countDocuments({ vendorId });
    const withdrawals = await VendorWithdrawal.find({ vendorId }).sort({ createdAt: -1 });

    const totalOrders = orders.length;
    const totalEarnings = vendor.balance;

    return {
      vendor,
      stats: {
        totalSales: vendor.totalSales,
        totalEarnings,
        pendingBalance: vendor.pendingBalance,
        totalOrders,
        productsCount,
      },
      recentOrders: orders.slice(0, 5),
      withdrawals,
    };
  },

  async requestWithdrawal(vendorId, { amount, payoutDetails, idempotencyKey }) {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) throw new ApiError(404, 'Vendor not found', ERROR_CODES.NOT_FOUND);

    if (typeof amount !== 'number' || amount <= 0) {
      throw new ApiError(400, 'Withdrawal amount must be greater than zero', ERROR_CODES.BAD_REQUEST);
    }

    const roundedAmount = moneyUtils.roundMoney(amount);

    const minSetting = await Settings.findOne({ key: 'MIN_PAYOUT_AMOUNT' });
    const minPayout = minSetting && !isNaN(Number(minSetting.value)) ? Number(minSetting.value) : 100;
    if (roundedAmount < minPayout) {
      throw new ApiError(400, `Minimum withdrawal amount is ₹${minPayout}`, ERROR_CODES.BAD_REQUEST);
    }

    // Idempotency check: prevent duplicate withdrawal submission
    if (idempotencyKey) {
      const existing = await VendorWithdrawal.findOne({ idempotencyKey, vendorId });
      if (existing) {
        return existing;
      }
    }

    // Atomic conditional balance reservation to prevent race conditions and overdraws
    const updatedVendor = await Vendor.findOneAndUpdate(
      {
        _id: vendorId,
        balance: { $gte: roundedAmount },
      },
      {
        $inc: {
          balance: -roundedAmount,
          pendingBalance: roundedAmount,
        },
      },
      { new: true }
    );

    if (!updatedVendor) {
      throw new ApiError(400, 'Insufficient available balance for withdrawal', ERROR_CODES.BAD_REQUEST);
    }

    const withdrawal = await VendorWithdrawal.create({
      vendorId,
      amount: roundedAmount,
      payoutDetails,
      idempotencyKey: idempotencyKey || undefined,
      status: 'PENDING',
    });

    // Create double-entry audit record in VendorLedger
    await VendorLedger.create({
      vendorId,
      transactionType: 'WITHDRAWAL_RESERVE',
      credit: 0,
      debit: roundedAmount,
      balanceSnapshot: updatedVendor.balance,
      description: `Reserved ₹${roundedAmount} for withdrawal request #${withdrawal._id}`,
      referenceId: withdrawal._id.toString(),
    });

    return withdrawal;
  },

  async checkVendorEligibility(userId) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw new ApiError(404, 'Vendor not found', ERROR_CODES.NOT_FOUND);

    if (vendor.status !== 'APPROVED') {
      throw new ApiError(403, 'Vendor account is not approved for product management', ERROR_CODES.FORBIDDEN);
    }

    const currentSub = await vendorSubscriptionService.getCurrentSubscription(vendor._id);
    if (!currentSub || currentSub.status !== 'ACTIVE' || currentSub.endDate < new Date()) {
      throw new ApiError(403, 'Active subscription is required to manage products', ERROR_CODES.FORBIDDEN);
    }

    return vendor;
  },
};
