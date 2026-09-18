import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema(
  {
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: [true, 'Wallet ID is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: [
        'COMMISSION_CREDIT',
        'VENDOR_EARNING',
        'WITHDRAWAL_DEBIT',
        'REFUND_REVERSAL',
        'PAYOUT',
        'ADJUSTMENT',
        'OTHER',
      ],
      required: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ['CREDIT', 'DEBIT'],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    referenceId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    referenceType: {
      type: String,
      default: 'SUBSCRIPTION',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index({ walletId: 1, createdAt: -1 });
walletTransactionSchema.index({ referenceId: 1, type: 1 });

export const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);
