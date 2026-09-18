import mongoose from 'mongoose';

const attributionChangeRequestSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    currentVendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
    requestedVendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '' },
  },
  { timestamps: true }
);

export const AttributionChangeRequest = mongoose.model('AttributionChangeRequest', attributionChangeRequestSchema);
