import mongoose from 'mongoose';

const customerSubscriptionSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerSubscriptionPlan', required: true },
    status: { 
      type: String, 
      enum: ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED', 'PAYMENT_FAILED'], 
      default: 'PENDING',
      index: true
    },
    startedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null, index: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
    autoRenew: { type: Boolean, default: false },
    cancelledAt: { type: Date, default: null },
    planSnapshot: { type: Object, required: true } // Name, price, duration, rewards at time of purchase
  },
  { timestamps: true }
);

export const CustomerSubscription = mongoose.model('CustomerSubscription', customerSubscriptionSchema);
