import mongoose from 'mongoose';

const shipmentTrackingEventSchema = new mongoose.Schema(
  {
    shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true, index: true },
    provider: { type: String, required: true },
    providerEventId: { type: String, default: '' },
    providerStatus: { type: String, required: true },
    internalStatus: { type: String, required: true },
    location: { type: String, default: '' },
    description: { type: String, default: '' },
    eventTime: { type: Date, required: true }
  },
  { timestamps: true }
);

// Idempotency: Prevent duplicate events from the courier
shipmentTrackingEventSchema.index({ shipmentId: 1, providerEventId: 1 }, { unique: true, partialFilterExpression: { providerEventId: { $ne: '' } } });

export const ShipmentTrackingEvent = mongoose.model('ShipmentTrackingEvent', shipmentTrackingEventSchema);
