import mongoose from 'mongoose';

const vendorStatusHistorySchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    previousStatus: { type: String },
    newStatus: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String }, // e.g., rejection reason
  },
  { timestamps: true }
);

export const VendorStatusHistory = mongoose.model('VendorStatusHistory', vendorStatusHistorySchema);
