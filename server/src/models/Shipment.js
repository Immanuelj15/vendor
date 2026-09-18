import mongoose from 'mongoose';

const shipmentSchema = new mongoose.Schema(
  {
    suborderId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorOrder', required: true, index: true, unique: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    courierProvider: { type: String, default: '' }, // e.g. SHIPROCKET, DELHIVERY
    courierService: { type: String, default: '' }, // standard, express
    courierOrderId: { type: String, default: '' },
    awbNumber: { type: String, default: '', index: true },
    originAddressSnapshot: { type: Object, required: true },
    destinationAddressSnapshot: { type: Object, required: true },
    packageWeight: { type: Number, required: true }, // KG
    length: { type: Number, required: true }, // CM
    width: { type: Number, required: true }, // CM
    height: { type: Number, required: true }, // CM
    packageCount: { type: Number, default: 1 },
    shippingCharge: { type: Number, default: 0 },
    status: { 
      type: String, 
      enum: [
        'DRAFT', 
        'READY', 
        'CREATED', 
        'PICKUP_REQUESTED', 
        'PICKUP_SCHEDULED', 
        'PICKED_UP', 
        'IN_TRANSIT', 
        'OUT_FOR_DELIVERY', 
        'DELIVERED', 
        'DELIVERY_FAILED', 
        'RETURN_INITIATED', 
        'RETURN_IN_TRANSIT', 
        'RETURNED', 
        'CANCELLED'
      ],
      default: 'DRAFT',
      index: true
    },
    pickupScheduledAt: { type: Date, default: null },
    pickedUpAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    estimatedDeliveryDate: { type: Date, default: null }
  },
  { timestamps: true }
);

export const Shipment = mongoose.model('Shipment', shipmentSchema);
