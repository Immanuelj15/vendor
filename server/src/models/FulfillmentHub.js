import mongoose from 'mongoose';

const fulfillmentHubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    type: { type: String, enum: ['WAREHOUSE', 'DISTRIBUTION_HUB'], required: true },
    territoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Territory', required: true, index: true },
    address: { type: String, required: true },
    contact: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
    },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true },
    operatingHours: { type: String, default: '9 AM - 6 PM' },
    capacity: { type: Number, default: 1000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const FulfillmentHub = mongoose.model('FulfillmentHub', fulfillmentHubSchema);
