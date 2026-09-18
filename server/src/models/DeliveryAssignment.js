import mongoose from 'mongoose';

const deliveryAssignmentSchema = new mongoose.Schema(
  {
    fulfillmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fulfillment', required: true, index: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', index: true },
    deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPartner', required: true, index: true },
    hubId: { type: mongoose.Schema.Types.ObjectId, ref: 'FulfillmentHub', required: true, index: true },
    status: {
      type: String,
      enum: ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED'],
      default: 'ASSIGNED',
      index: true,
    },
    assignedAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date },
    pickedUpAt: { type: Date },
    outForDeliveryAt: { type: Date },
    deliveredAt: { type: Date },
    failedAt: { type: Date },
  },
  { timestamps: true }
);

export const DeliveryAssignment = mongoose.model('DeliveryAssignment', deliveryAssignmentSchema);
