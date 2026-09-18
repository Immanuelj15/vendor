import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    category: {
      type: String,
      enum: ['MLM', 'FAIR_COINS', 'SPIN_WHEEL', 'MARKETPLACE', 'GENERAL'],
      default: 'GENERAL',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export const Settings = mongoose.model('Settings', settingsSchema);
