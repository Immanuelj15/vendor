import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema(
  {
    shopkeeperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shopkeeper',
      required: true,
      index: true,
    },
    talukFranchiseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Franchise',
      required: true,
      index: true,
    },
    shopName: {
      type: String,
      required: true,
      trim: true,
    },
    shopCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    taluk: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
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
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE', 'EXPIRED'],
      default: 'PENDING',
      index: true,
    },
    kycStatus: {
      type: String,
      required: true,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
    },
    qrPublicToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    activatedAt: {
      type: Date,
    },
    renewalDate: {
      type: Date,
    }
  },
  { timestamps: true }
);

export const Shop = mongoose.model('Shop', shopSchema);
