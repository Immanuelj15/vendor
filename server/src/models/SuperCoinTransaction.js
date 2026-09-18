import mongoose from 'mongoose';

const superCoinTransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'CREDIT',
        'DEBIT',
        'REFUND',
        'BONUS',
        'SPIN_REWARD',
        'ADMIN_ADJUSTMENT',
        'EXPIRATION',
      ],
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    source: { type: String, required: true }, // e.g. "PREMIUM_SUBSCRIPTION", "SPIN_WHEEL", "BILL_UPLOAD"
    referenceId: { type: String, default: '', index: true }, // Ensure idempotency
    description: { type: String, default: '' },
    status: { type: String, enum: ['COMPLETED', 'FAILED', 'REVERSED'], default: 'COMPLETED' },
  },
  { timestamps: true }
);

export const SuperCoinTransaction = mongoose.model('SuperCoinTransaction', superCoinTransactionSchema);
