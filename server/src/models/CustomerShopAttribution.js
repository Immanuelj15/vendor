import mongoose from 'mongoose';

const customerShopAttributionSchema = new mongoose.Schema(
  {
    customerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true,
    },
    attributedVia: {
      type: String,
      enum: ['QR_CODE', 'ADMIN_ASSIGNMENT'],
      default: 'QR_CODE',
    },
    qrCodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShopQRCode',
      default: null,
      index: true,
    },
    attributedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },
    sourceToken: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const CustomerShopAttribution = mongoose.model('CustomerShopAttribution', customerShopAttributionSchema);
