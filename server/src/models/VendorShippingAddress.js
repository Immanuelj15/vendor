import mongoose from 'mongoose';

const vendorShippingAddressSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    contactName: { type: String, required: true },
    businessName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: '' },
    state: { type: mongoose.Schema.Types.ObjectId, ref: 'Territory', required: true },
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'Territory', required: true },
    area: { type: mongoose.Schema.Types.ObjectId, ref: 'Territory', required: true },
    pincode: { type: String, required: true },
    landmark: { type: String, default: '' },
    isDefault: { type: Boolean, default: false },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

export const VendorShippingAddress = mongoose.model('VendorShippingAddress', vendorShippingAddressSchema);
