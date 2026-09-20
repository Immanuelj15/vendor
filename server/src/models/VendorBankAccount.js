import mongoose from 'mongoose';
import { encrypt, decrypt } from '../utils/cryptoUtils.js';

const vendorBankAccountSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      unique: true,
    },
    accountHolderName: {
      type: String,
      required: true,
      trim: true,
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
      select: false, // Protected: never selected by default
    },
    accountNumberEncrypted: {
      type: String,
      select: false,
    },
    accountNumberMasked: {
      type: String,
      default: '',
    },
    ifscCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    branchName: {
      type: String,
      trim: true,
    },
    upiId: {
      type: String,
      trim: true,
      default: '',
    },
    bankProofUpload: {
      type: String,
      default: '',
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save hook: auto-compute masked account number and encrypt full account number at rest
vendorBankAccountSchema.pre('save', function (next) {
  if (this.isModified('accountNumber') && this.accountNumber) {
    const raw = this.accountNumber.trim();
    const last4 = raw.slice(-4);
    const maskedPrefix = 'X'.repeat(Math.max(0, raw.length - 4)) || 'XXXXXX';
    this.accountNumberMasked = `${maskedPrefix}${last4}`;
    try {
      this.accountNumberEncrypted = encrypt(raw);
    } catch (err) {
      console.warn('[VendorBankAccount] Encryption warning:', err.message);
    }
  }
  next();
});

// Safe method for API responses ensuring account number is never exposed in raw format
vendorBankAccountSchema.methods.toMaskedJSON = function () {
  const obj = this.toObject();
  delete obj.accountNumber;
  delete obj.accountNumberEncrypted;
  obj.accountNumber = this.accountNumberMasked || (this.accountNumber ? `XXXXXX${this.accountNumber.slice(-4)}` : '');
  return obj;
};

// Method to retrieve unmasked account number strictly for authorized payout processing
vendorBankAccountSchema.methods.getDecryptedAccountNumber = function () {
  if (this.accountNumberEncrypted) {
    try {
      return decrypt(this.accountNumberEncrypted);
    } catch {
      return this.accountNumber;
    }
  }
  return this.accountNumber;
};

export const VendorBankAccount = mongoose.model('VendorBankAccount', vendorBankAccountSchema);
export const VendorPayoutProfile = VendorBankAccount;
export default VendorBankAccount;
