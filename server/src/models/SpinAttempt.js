import mongoose from 'mongoose';

const spinAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    wheelId: { type: mongoose.Schema.Types.ObjectId, ref: 'SpinWheel', required: true },
    idempotencyKey: { type: String, required: true, unique: true },
    rewardId: { type: mongoose.Schema.Types.ObjectId, default: null },
    status: { type: String, enum: ['PENDING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
  },
  { timestamps: true }
);

export const SpinAttempt = mongoose.model('SpinAttempt', spinAttemptSchema);
