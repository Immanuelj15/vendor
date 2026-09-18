import mongoose from 'mongoose';

const financeAdjustmentSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    amount: { type: Number, required: true }, // Can be positive or negative
    reason: { type: String, required: true },
    referenceId: { type: String, default: '' },
    status: { type: String, enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'], default: 'PENDING_APPROVAL', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export const FinanceAdjustment = mongoose.model('FinanceAdjustment', financeAdjustmentSchema);
