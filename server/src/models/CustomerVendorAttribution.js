import mongoose from 'mongoose';

const customerVendorAttributionSchema = new mongoose.Schema(
  {
    customerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    qrCodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VendorQRCode',
      default: null,
    },
    source: {
      type: String,
      enum: ['QR_SCAN', 'REFERRAL_LINK', 'ADMIN_ASSIGNMENT', 'MANUAL'],
      default: 'QR_SCAN',
    },
    sourceCode: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'REVOKED'],
      default: 'ACTIVE',
      index: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
      index: true,
    },
    attributedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// A customer can only have ONE primary attribution. We enforce this through application logic,
// but a partial unique index could also be used in MongoDB.
customerVendorAttributionSchema.index(
  { customerUserId: 1 },
  { unique: true, partialFilterExpression: { isPrimary: true } }
);

// Prevent duplicate attributions for the exact same customer and vendor
customerVendorAttributionSchema.index(
  { customerUserId: 1, vendorId: 1 },
  { unique: true }
);

export const CustomerVendorAttribution = mongoose.model('CustomerVendorAttribution', customerVendorAttributionSchema);
