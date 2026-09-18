import mongoose from 'mongoose';

const billRewardRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    rewardType: { type: String, enum: ['FIXED_SUPER_COINS', 'PER_AMOUNT_SUPER_COINS', 'PERCENTAGE'], required: true },
    rate: { type: Number, required: true },
    basis: { type: Number, default: 100 }, // e.g., 10 Super Coins PER basis (100 INR)
    maxReward: { type: Number, default: 500 }, // Max Super Coins per bill
    minimumPurchaseAmount: { type: Number, default: 0 },
    premiumMultiplier: { type: Number, default: 1 }, // E.g., 1.5x for premium members
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

export const BillRewardRule = mongoose.model('BillRewardRule', billRewardRuleSchema);
