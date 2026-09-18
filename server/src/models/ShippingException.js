import mongoose from 'mongoose';

const shippingExceptionSchema = new mongoose.Schema(
  {
    shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', default: null, index: true },
    provider: { type: String, required: true },
    errorCode: { type: String, default: '' },
    errorMessage: { type: String, required: true },
    requestReference: { type: String, default: '' },
    status: { type: String, enum: ['UNRESOLVED', 'RESOLVED'], default: 'UNRESOLVED', index: true },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export const ShippingException = mongoose.model('ShippingException', shippingExceptionSchema);
