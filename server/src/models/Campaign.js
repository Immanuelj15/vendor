import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    multiplier: { type: Number, default: 2 }, // e.g. 2x Double Coins
    type: { type: String, enum: ['REFERRAL_BOOST', 'PURCHASE_BOOST'], default: 'REFERRAL_BOOST' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Campaign = mongoose.model('Campaign', campaignSchema);
