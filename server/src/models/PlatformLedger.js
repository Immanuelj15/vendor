import mongoose from 'mongoose';

const platformLedgerSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'ORDER_COMMISSION',
        'VENDOR_SUBSCRIPTION',
        'CUSTOMER_SUBSCRIPTION',
        'PAYOUT_FEE',
        'WITHDRAWAL',
        'REFUND_REVERSAL',
        'ADJUSTMENT',
      ],
      required: true,
      index: true,
    },
    sourceEntityType: {
      type: String,
      enum: ['ORDER', 'SUBSCRIPTION', 'WITHDRAWAL', 'MANUAL'],
      required: true,
    },
    sourceEntityId: {
      type: String,
      required: true,
      index: true,
    },
    credit: {
      type: Number,
      default: 0,
      min: 0,
    },
    debit: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceSnapshot: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

export const PlatformLedger = mongoose.model('PlatformLedger', platformLedgerSchema);
export default PlatformLedger;
