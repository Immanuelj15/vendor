import mongoose from 'mongoose';

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: [true, 'Event ID is required'],
      unique: true,
      index: true,
      trim: true,
    },
    gateway: {
      type: String,
      default: 'RAZORPAY',
      trim: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['RECEIVED', 'PROCESSED', 'FAILED'],
      default: 'RECEIVED',
      index: true,
    },
    payloadHash: {
      type: String,
      default: '',
    },
    processedAt: {
      type: Date,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);
