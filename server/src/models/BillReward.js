import mongoose from 'mongoose';

const billRewardSchema = new mongoose.Schema(
  {
    billId: { type: mongoose.Schema.Types.ObjectId, ref: 'OfflineBill', required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ruleId: { type: mongoose.Schema.Types.ObjectId, ref: 'BillRewardRule', required: true },
    rewardType: { type: String, required: true },
    purchaseAmount: { type: Number, required: true },
    calculatedAmount: { type: Number, required: true }, // Math result before cap
    finalAmount: { type: Number, required: true }, // After maxReward capping
    status: { type: String, enum: ['PENDING', 'CREDITED', 'REVERSED', 'FAILED'], default: 'PENDING' },
    superCoinTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperCoinTransaction', default: null },
    ruleSnapshot: { type: Object, required: true }, // Freeze rule values at time of approval
  },
  { timestamps: true }
);

// Prevent duplicate rewards per bill
billRewardSchema.index({ billId: 1, rewardType: 1 }, { unique: true });

export const BillReward = mongoose.model('BillReward', billRewardSchema);
