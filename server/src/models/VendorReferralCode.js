import mongoose from 'mongoose';

const vendorReferralCodeSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    code: { type: String, required: true, unique: true, index: true }, // e.g. "VEND-A8K29"
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'REVOKED'], default: 'ACTIVE' },
    isPrimary: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Prevent multiple primary codes per vendor
vendorReferralCodeSchema.index(
  { vendorId: 1 },
  { unique: true, partialFilterExpression: { isPrimary: true } }
);

export const VendorReferralCode = mongoose.model('VendorReferralCode', vendorReferralCodeSchema);
