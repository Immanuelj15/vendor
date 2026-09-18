import mongoose from 'mongoose';

const commissionSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: false, default: null, index: true },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', default: null, index: true },
    level: { type: Number, default: 1 },
    type: { 
      type: String, 
      enum: [
        'PLATFORM_COMMISSION', 
        'NETWORK_COMMISSION', 
        'MLM_VENDOR_SUBSCRIPTION_COMMISSION',
        'MLM_UPLINE_COMMISSION',
        'OTHER_COMMISSION', 
        'REFUND_REVERSAL', 
        'ADJUSTMENT'
      ], 
      required: true 
    },
    recipientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
    ruleSnapshotId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommissionRule', default: null }, // Or NetworkCommissionRule
    orderAmount: { type: Number, required: true },
    commissionPercentage: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    status: { type: String, enum: ['PENDING', 'PAID', 'CANCELLED'], default: 'PENDING' },
  },
  { timestamps: true }
);

commissionSchema.index(
  { subscriptionId: 1, level: 1, recipientUserId: 1 },
  { 
    unique: true, 
    partialFilterExpression: { subscriptionId: { $type: 'objectId' } } 
  }
);
commissionSchema.index({ orderId: 1, recipientUserId: 1 }, { sparse: true });

export const Commission = mongoose.model('Commission', commissionSchema);
export default Commission;
