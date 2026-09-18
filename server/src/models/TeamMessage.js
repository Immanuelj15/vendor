import mongoose from 'mongoose';

const teamMessageSchema = new mongoose.Schema(
  {
    senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // Upline Sponsor
    title: { type: String, required: true },
    message: { type: String, required: true },
    targetLevel: { type: Number, default: 1 }, // 1 = Level 1 direct team
  },
  { timestamps: true }
);

export const TeamMessage = mongoose.model('TeamMessage', teamMessageSchema);
