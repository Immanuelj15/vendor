import mongoose from 'mongoose';

const spinHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    wheelId: { type: mongoose.Schema.Types.ObjectId, ref: 'SpinWheel', required: true },
    rewardId: { type: mongoose.Schema.Types.ObjectId },
    rewardTitle: { type: String, required: true },
    rewardType: { type: String, required: true },
    rewardValue: { type: Number, default: 0 },
    probabilitySnapshot: { type: Number, required: true },
  },
  { timestamps: true }
);

export const SpinHistory = mongoose.model('SpinHistory', spinHistorySchema);
