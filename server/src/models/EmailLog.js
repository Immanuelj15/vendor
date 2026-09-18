import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema(
  {
    dedupeKey: { type: String, unique: true, required: true, index: true },
    recipientEmail: { type: String, required: true },
    subject: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const EmailLog = mongoose.model('EmailLog', emailLogSchema);
