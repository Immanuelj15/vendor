import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      default: '',
    },
    monthlyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    yearlyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      required: true,
    },
    applicableEntityType: {
      type: String,
      required: true,
      enum: ['FRANCHISE', 'SHOPKEEPER', 'SHOP', 'VENDOR'],
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    features: [
      {
        type: String,
      }
    ],
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  { timestamps: true }
);

export const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
