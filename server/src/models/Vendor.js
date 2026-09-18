import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    storeName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, default: '' },
    logo: { type: String, default: '' },
    banner: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },
    status: {
      type: String,
      enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED', 'BLOCKED', 'EXPIRED'],
      default: 'PENDING',
      index: true,
    },
    currentAreaAssignment: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'VendorAreaAssignment',
      default: null
    },
    kycStatus: {
      type: String,
      enum: ['PENDING', 'PARTIALLY_VERIFIED', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
    },
    termsAccepted: { type: Boolean, default: false },
    termsAcceptedAt: { type: Date },
    commissionRate: { type: Number, default: 10 }, // 10% platform commission default
    totalSales: { type: Number, default: 0 },
    balance: { type: Number, default: 0 }, // Available for withdrawal
    pendingBalance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Vendor = mongoose.model('Vendor', vendorSchema);
export default Vendor;
