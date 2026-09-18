import mongoose from 'mongoose';

const attributionHistorySchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    previousVendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
    newVendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    source: { type: String, enum: ['QR_SCAN', 'REFERRAL_LINK', 'ADMIN_ASSIGNMENT', 'CUSTOMER_REQUEST'], required: true },
    reason: { type: String, default: '' },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const AttributionHistory = mongoose.model('AttributionHistory', attributionHistorySchema);
