import mongoose from 'mongoose';

const vendorBankAccountSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    accountHolderName: { type: String, required: true, trim: true },
    bankName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    ifscCode: { type: String, required: true, trim: true, uppercase: true },
    branchName: { type: String, trim: true },
    bankProofUpload: { type: String }, // URL/path to cancelled cheque or passbook
    verificationStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

export const VendorBankAccount = mongoose.model('VendorBankAccount', vendorBankAccountSchema);
