import mongoose from 'mongoose';

const spinRewardSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g. "50 Fair Coins", "Free Shipping", "Try Again"
  type: {
    type: String,
    enum: ['FAIR_COINS', 'SUPER_COINS', 'COUPON', 'FREE_SHIPPING', 'TRY_AGAIN'],
    required: true,
  },
  value: { type: Number, default: 0 }, // e.g. 50 coins
  probability: { type: Number, required: true }, // Weight percentage e.g. 20 (for 20%)
  color: { type: String, default: '#22c55e' },
  icon: { type: String, default: 'coins' },
});

const spinWheelSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, default: 'Daily FairKart Spin & Win' },
    description: { type: String, default: 'Spin the wheel every day to win instant Fair Coins & Coupons!' },
    isActive: { type: Boolean, default: true },
    requiresPremium: { type: Boolean, default: false },
    dailySpinsPerUser: { type: Number, default: 1 },
    coinsRequiredPerSpin: { type: Number, default: 0 },
    rewards: [spinRewardSchema],
  },
  { timestamps: true }
);

export const SpinWheel = mongoose.model('SpinWheel', spinWheelSchema);
