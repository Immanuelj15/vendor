import mongoose from 'mongoose';

const vendorAddressSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    state: { type: mongoose.Schema.Types.ObjectId, ref: 'Territory', required: true },
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'Territory', required: true },
    talukArea: { type: mongoose.Schema.Types.ObjectId, ref: 'Territory', required: true },
    pincode: { type: String, required: true, trim: true },
    fullAddress: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const VendorAddress = mongoose.model('VendorAddress', vendorAddressSchema);
