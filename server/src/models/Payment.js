import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: false, index: true },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', default: null, index: true },
    customerSubscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerSubscription', default: null, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    paymentMethod: { type: String, enum: ['RAZORPAY', 'STRIPE', 'COD'], required: true },
    transactionId: { type: String, required: true, unique: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { 
      type: String, 
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CREATED', 'AUTHORIZED', 'CAPTURED'], 
      default: 'PENDING' 
    },
    razorpayOrderId: { type: String, index: true, sparse: true },
    razorpayPaymentId: { type: String, index: true, sparse: true },
    failureReason: { type: String, default: '' },
    verifiedAt: { type: Date },
    gatewaySignature: { type: String, default: '' },
    gatewayRawResponse: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Payment = mongoose.model('Payment', paymentSchema);
