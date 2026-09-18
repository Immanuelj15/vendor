import mongoose from 'mongoose';

const vendorQRCodeSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      unique: true, // Enforces one active QR per vendor logically (if we soft delete or revoke, this might need adjustment, but for now we keep one record per vendor and change its status).
      index: true,
    },
    publicToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'REVOKED'],
      default: 'ACTIVE',
      index: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const VendorQRCode = mongoose.model('VendorQRCode', vendorQRCodeSchema);
