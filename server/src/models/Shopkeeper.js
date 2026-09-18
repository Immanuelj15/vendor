import mongoose from 'mongoose';

const shopkeeperSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    talukFranchiseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Franchise',
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE', 'EXPIRED'],
      default: 'PENDING',
      index: true,
    },
    onboardingStatus: {
      type: String,
      required: true,
      enum: ['PENDING', 'KYC_SUBMITTED', 'KYC_APPROVED', 'SUBSCRIBED', 'APPROVED'],
      default: 'PENDING',
    },
    kycStatus: {
      type: String,
      required: true,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
    },
    appointedAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    renewalDate: {
      type: Date,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    }
  },
  { timestamps: true }
);

export const Shopkeeper = mongoose.model('Shopkeeper', shopkeeperSchema);
