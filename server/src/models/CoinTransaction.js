import mongoose from 'mongoose';

const coinTransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'CREDIT',
        'DEBIT',
        'REFUND',
        'BONUS',
        'REFERRAL_REWARD',
        'PURCHASE_REWARD',
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
    source: { type: String, required: true }, // e.g. "REGISTRATION", "REFERRAL_REGISTRATION", "CHECKOUT_REDEMPTION", "SPIN_WHEEL"
    referenceId: { type: String, default: '', index: true }, // e.g. orderId, spinHistoryId, referralId
    description: { type: String, default: '' },
    status: { type: String, enum: ['COMPLETED', 'FAILED', 'REVERSED'], default: 'COMPLETED' },
  },
  { timestamps: true }
);

export const CoinTransaction = mongoose.model('CoinTransaction', coinTransactionSchema);
export default CoinTransaction;
