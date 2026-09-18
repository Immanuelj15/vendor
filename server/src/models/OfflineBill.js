import mongoose from 'mongoose';

const offlineBillSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    billNumber: { type: String, required: true, trim: true, index: true },
    billDate: { type: Date, required: true },
    storeName: { type: String, required: true, trim: true },
    storePhone: { type: String, default: '' },
    storeAddress: { type: String, default: '' },
    purchaseAmount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: 'INR' },
    fileUrl: { type: String, required: true }, // URL securely linking to the uploaded image/PDF
    status: { 
      type: String, 
      enum: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED'], 
      default: 'SUBMITTED',
      index: true
    },
    flags: [{ type: String }], // Array of potential fraud/duplicate flags
    rejectionReason: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    ocrRawData: { type: Object, default: null }, // Stub for OCR result
  },
  { timestamps: true }
);

export const OfflineBill = mongoose.model('OfflineBill', offlineBillSchema);
