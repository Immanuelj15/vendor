import mongoose from 'mongoose';

const deliveryZoneSchema = new mongoose.Schema(
  {
    hubId: { type: mongoose.Schema.Types.ObjectId, ref: 'FulfillmentHub', required: true, index: true },
    territoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Territory', required: true, index: true },
    pincodes: [{ type: String, index: true }],
    deliveryFee: { type: Number, default: 0 },
    estimatedDeliveryDays: { type: Number, default: 3 },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true },
  },
  { timestamps: true }
);

export const DeliveryZone = mongoose.model('DeliveryZone', deliveryZoneSchema);
