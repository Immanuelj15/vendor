import mongoose from 'mongoose';

const customerSubscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Premium Monthly"
    code: { type: String, required: true, unique: true }, // e.g. "PREMIUM_MONTHLY"
    description: { type: String, default: '' },
    durationValue: { type: Number, required: true },
    durationUnit: { type: String, enum: ['DAY', 'MONTH', 'YEAR'], required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    rewardRules: {
      coinsOnSubscribe: { type: Number, default: 0 },
      superCoinsOnSubscribe: { type: Number, default: 0 },
      monthlyCoinAllowance: { type: Number, default: 0 }, // For future expansion
    },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

export const CustomerSubscriptionPlan = mongoose.model('CustomerSubscriptionPlan', customerSubscriptionPlanSchema);
