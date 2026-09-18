import mongoose from 'mongoose';

const paymentReconciliationSchema = new mongoose.Schema(
  {
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
    transactionId: { type: String, required: true, index: true },
    gatewayReference: { type: String, default: '' },
    internalAmount: { type: Number, required: true },
    gatewayAmount: { type: Number, required: true },
    internalStatus: { type: String, required: true },
    gatewayStatus: { type: String, required: true },
    reconciliationStatus: {
      type: String,
      enum: ['MATCHED', 'AMOUNT_MISMATCH', 'STATUS_MISMATCH', 'MISSING_IN_GATEWAY', 'RESOLVED'],
      default: 'MATCHED',
      index: true
    },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolutionNote: { type: String, default: '' },
    resolvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export const PaymentReconciliation = mongoose.model('PaymentReconciliation', paymentReconciliationSchema);
