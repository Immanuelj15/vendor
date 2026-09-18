import mongoose from 'mongoose';

const referralRewardSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // Reward recipient
    sourceUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User whose registration/purchase triggered reward
    level: { type: Number, required: true }, // Referral level (1, 2, 3)
    rewardType: { type: String, enum: ['FAIR_COINS', 'COMMISSION_PERCENT'], required: true },
    rewardValue: { type: Number, required: true },
    referenceId: { type: String, default: '' },
    description: { type: String, default: '' },
    status: { type: String, enum: ['PENDING', 'CREDITED', 'CANCELLED'], default: 'CREDITED' },
  },
  { timestamps: true }
);

export const ReferralReward = mongoose.model('ReferralReward', referralRewardSchema);
