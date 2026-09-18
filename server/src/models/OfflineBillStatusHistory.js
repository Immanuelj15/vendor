import mongoose from 'mongoose';

const offlineBillStatusHistorySchema = new mongoose.Schema(
  {
    billId: { type: mongoose.Schema.Types.ObjectId, ref: 'OfflineBill', required: true, index: true },
    previousStatus: { type: String, required: true },
    newStatus: { type: String, required: true },
    reason: { type: String, default: '' },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const OfflineBillStatusHistory = mongoose.model('OfflineBillStatusHistory', offlineBillStatusHistorySchema);
