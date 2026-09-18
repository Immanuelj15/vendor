import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema(
  {
    fulfillmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fulfillment', required: true, index: true },
    packageNumber: { type: String, required: true, unique: true, index: true },
    trackingNumber: { type: String, required: true, unique: true, index: true },
    weight: { type: Number, default: 0 },
    dimensions: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['PACKED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'],
      default: 'PACKED',
    },
    packedAt: { type: Date },
    dispatchedAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

export const Package = mongoose.model('Package', packageSchema);
