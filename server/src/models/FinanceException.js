import mongoose from 'mongoose';

const financeExceptionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['NEGATIVE_PAYABLE', 'PAYMENT_ALLOCATION_EXCEPTION', 'COMMISSION_EXCEPTION', 'SETTLEMENT_MISMATCH', 'OTHER'],
      required: true,
      index: true
    },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, // Order, VendorOrder, Payment
    referenceModel: { type: String, enum: ['Order', 'VendorOrder', 'Payment', 'VendorSettlement'], required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['OPEN', 'RESOLVED'], default: 'OPEN', index: true },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolutionNote: { type: String, default: '' },
    resolvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export const FinanceException = mongoose.model('FinanceException', financeExceptionSchema);
