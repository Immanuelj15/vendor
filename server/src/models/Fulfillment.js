import mongoose from 'mongoose';

const fulfillmentItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  pickedQuantity: { type: Number, default: 0 },
  missingQuantity: { type: Number, default: 0 },
});

const fulfillmentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    vendorOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorOrder', required: true, index: true, unique: true },
    sourceType: { type: String, enum: ['VENDOR', 'SHOP', 'WAREHOUSE', 'HUB'], required: true },
    sourceId: { type: mongoose.Schema.Types.ObjectId, required: true }, // refers to Vendor, Shop, or Hub/Warehouse depending on sourceType
    hubId: { type: mongoose.Schema.Types.ObjectId, ref: 'FulfillmentHub', index: true },
    status: {
      type: String,
      enum: [
        'PENDING',
        'PROCESSING',
        'PICKED',
        'PACKED',
        'READY_FOR_DISPATCH',
        'DISPATCHED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
        'RETURN_REQUESTED',
        'RETURNED',
      ],
      default: 'PENDING',
      index: true,
    },
    items: [fulfillmentItemSchema],
    assignedAt: { type: Date },
    packedAt: { type: Date },
    dispatchedAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Fulfillment = mongoose.model('Fulfillment', fulfillmentSchema);
