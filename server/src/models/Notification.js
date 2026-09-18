import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      default: 'SYSTEM',
      index: true,
    },
    isRead: { type: Boolean, default: false },
    link: { type: String, default: '' },
    data: { type: mongoose.Schema.Types.Mixed, default: null },
    readAt: { type: Date, default: null },
    priority: { type: String, enum: ['LOW', 'NORMAL', 'HIGH'], default: 'NORMAL', index: true },
    dedupeKey: { type: String, unique: true, sparse: true, index: true },
  },
  { timestamps: true }
);

export const Notification = mongoose.model('Notification', notificationSchema);
