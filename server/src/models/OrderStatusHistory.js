import mongoose from 'mongoose';

const orderStatusHistorySchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    fulfillmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fulfillment', index: true },
    status: { type: String, required: true },
    actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const OrderStatusHistory = mongoose.model('OrderStatusHistory', orderStatusHistorySchema);
