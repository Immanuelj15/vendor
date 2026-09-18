import mongoose from 'mongoose';

const vendorWithdrawalSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING', index: true },
    payoutDetails: {
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      upiId: String,
    },
    adminNotes: { type: String, default: '' },
    idempotencyKey: { type: String, sparse: true, unique: true, index: true },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const VendorWithdrawal = mongoose.model('VendorWithdrawal', vendorWithdrawalSchema);
