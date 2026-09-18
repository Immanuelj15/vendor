import mongoose from 'mongoose';

const vendorBusinessSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    businessType: { type: String, trim: true },
    gstNumber: { type: String, trim: true, uppercase: true },
    gstStatus: { type: String, enum: ['NOT_REGISTERED', 'PENDING', 'VERIFIED', 'REJECTED'], default: 'NOT_REGISTERED' },
    panNumber: { type: String, trim: true, uppercase: true },
  },
  { timestamps: true }
);

export const VendorBusiness = mongoose.model('VendorBusiness', vendorBusinessSchema);
