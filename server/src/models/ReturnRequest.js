import mongoose from 'mongoose';

const returnRequestSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    fulfillmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fulfillment', required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reason: { type: String, required: true },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    status: {
      type: String,
      enum: ['REQUESTED', 'APPROVED', 'REJECTED', 'PICKUP_PENDING', 'RECEIVED', 'COMPLETED', 'CANCELLED'],
      default: 'REQUESTED',
      index: true,
    },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    receivedAt: { type: Date },
    resolvedAt: { type: Date },
    adminNote: { type: String, default: '' },
  },
  { timestamps: true }
);

export const ReturnRequest = mongoose.model('ReturnRequest', returnRequestSchema);
