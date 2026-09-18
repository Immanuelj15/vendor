import mongoose from 'mongoose';

const deliveryPartnerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'ON_DELIVERY'],
      default: 'ACTIVE',
      index: true,
    },
    vehicleType: {
      type: String,
      enum: ['BIKE', 'CAR', 'VAN', 'TRUCK'],
      default: 'BIKE',
    },
    vehicleNumber: { type: String, default: '' },
    serviceZones: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Territory' }],
    assignedHubId: { type: mongoose.Schema.Types.ObjectId, ref: 'FulfillmentHub', index: true },
  },
  { timestamps: true }
);

export const DeliveryPartner = mongoose.model('DeliveryPartner', deliveryPartnerSchema);
