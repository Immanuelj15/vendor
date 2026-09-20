import mongoose from 'mongoose';

const platformFinancialConfigSchema = new mongoose.Schema(
  {
    platformName: {
      type: String,
      default: 'FairKart Global E-Commerce',
      trim: true,
    },
    bankName: {
      type: String,
      default: '',
      trim: true,
    },
    accountHolderName: {
      type: String,
      default: '',
      trim: true,
    },
    accountNumberEncrypted: {
      type: String,
      default: '',
      select: false,
    },
    accountNumberMasked: {
      type: String,
      default: '',
    },
    ifscCode: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    upiId: {
      type: String,
      default: '',
      trim: true,
    },
    gstin: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    pan: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    taxPercentage: {
      type: Number,
      default: 18,
    },
    defaultCommissionRate: {
      type: Number,
      default: 10,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const PlatformFinancialConfig = mongoose.model('PlatformFinancialConfig', platformFinancialConfigSchema);
export default PlatformFinancialConfig;
