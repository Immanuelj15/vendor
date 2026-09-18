import mongoose from 'mongoose';

const subscriptionOrderSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    billingCycle: {
      type: String,
      required: true,
      enum: ['MONTHLY', 'YEARLY'],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING_PAYMENT', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED'],
      default: 'PENDING_PAYMENT',
      index: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
  },
  { timestamps: true }
);

export const SubscriptionOrder = mongoose.model('SubscriptionOrder', subscriptionOrderSchema);
