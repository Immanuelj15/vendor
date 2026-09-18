import mongoose from 'mongoose';

const suborderStatusHistorySchema = new mongoose.Schema(
  {
    suborderId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorOrder', required: true, index: true },
    previousStatus: { type: String, required: true },
    newStatus: { type: String, required: true },
    reason: { type: String, default: '' },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const SuborderStatusHistory = mongoose.model('SuborderStatusHistory', suborderStatusHistorySchema);
