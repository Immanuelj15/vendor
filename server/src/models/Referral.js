import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // Referrer (Upline)
    referredUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // Referred user (Downline)
    parentReferralId: { type: mongoose.Schema.Types.ObjectId, ref: 'Referral', default: null, index: true },
    level: { type: Number, required: true, min: 1, max: 10, index: true }, // 1 = Direct, 2 = Level 2, 3 = Level 3
    status: { type: String, enum: ['PENDING', 'ACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
    activatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

referralSchema.index({ userId: 1, referredUserId: 1 }, { unique: true });

export const Referral = mongoose.model('Referral', referralSchema);
