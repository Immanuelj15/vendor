import mongoose from 'mongoose';

const vendorOrderSchema = new mongoose.Schema(
  {
    publicSuborderId: { type: String, required: true, unique: true, index: true },
    subOrderNumber: { type: String, required: true, unique: true, index: true }, // Keep
    parentOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    vendorNameSnapshot: { type: String, required: true },
    businessNameSnapshot: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
        name: String,
        productNameSnapshot: String,
        skuSnapshot: String,
        price: Number,
        unitPrice: Number,
        quantity: Number,
        taxSnapshot: { type: Number, default: 0 },
        discountSnapshot: { type: Number, default: 0 },
        lineTotal: Number,
        variantSku: String,
        image: String,
        productImageSnapshot: String,
      },
    ],
    subtotal: { type: Number, required: true }, // Keep
    itemsSubtotal: { type: Number, required: true },
    taxTotal: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    shippingTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    platformCommission: { type: Number, required: true }, // Platform fee (e.g. 10%)
    vendorEarning: { type: Number, required: true }, // Net payout to vendor
    status: {
      type: String,
      enum: [
        'PENDING',
        'CONFIRMED',
        'PROCESSING',
        'PACKED',
        'READY_TO_SHIP',
        'SHIPMENT_CREATED',
        'PICKUP_REQUESTED',
        'PICKUP_SCHEDULED',
        'PICKED_UP',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'DELIVERY_FAILED',
        'CANCELLED',
        'RETURN_INITIATED',
        'RETURN_IN_TRANSIT',
        'RETURN_REQUESTED',
        'RETURNED',
        'REFUNDED',
      ],
      default: 'PENDING',
      index: true,
    },
  },
  { timestamps: true }
);

export const VendorOrder = mongoose.model('VendorOrder', vendorOrderSchema);
