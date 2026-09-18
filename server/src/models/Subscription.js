import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: ['FRANCHISE', 'SHOPKEEPER', 'SHOP', 'VENDOR'],
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
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
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    renewalCount: {
      type: Number,
      default: 0,
    },
    lastPaymentAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    }
  },
  { timestamps: true }
);

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
