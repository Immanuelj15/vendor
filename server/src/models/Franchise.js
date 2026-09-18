import mongoose from 'mongoose';

const franchiseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    franchiseType: {
      type: String,
      required: true,
      enum: ['STATE', 'DISTRICT', 'TALUK'],
      index: true,
    },
    territoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Territory',
      required: true,
      index: true,
    },
    parentFranchiseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Franchise',
      default: null,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED', 'EXPIRED', 'TERMINATED'],
      default: 'PENDING',
      index: true,
    },
    appointmentDate: {
      type: Date,
      default: Date.now,
    },
    activationDate: {
      type: Date,
    },
    expiryDate: {
      type: Date,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
    },
    kycStatus: {
      type: String,
      required: true,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
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
    },
    address: {
      type: String,
      trim: true,
    },
    documents: [
      {
        type: String,
      }
    ],
    notes: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    }
  },
  { timestamps: true }
);

franchiseSchema.index({ franchiseType: 1, status: 1 });

export const Franchise = mongoose.model('Franchise', franchiseSchema);
