import mongoose from 'mongoose';

const shippingProviderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true }, // e.g. SHIPROCKET, DELHIVERY
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'INACTIVE' },
    configurationReference: { type: String, default: '' }, // e.g. ID for secure config store
  },
  { timestamps: true }
);

export const ShippingProvider = mongoose.model('ShippingProvider', shippingProviderSchema);
