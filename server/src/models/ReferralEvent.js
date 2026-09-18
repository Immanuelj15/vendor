import mongoose from 'mongoose';

const referralEventSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    referralCodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorReferralCode', default: null },
    eventType: { 
      type: String, 
      enum: ['QR_SCANNED', 'LINK_OPENED', 'REGISTRATION_STARTED', 'REGISTRATION_COMPLETED', 'ATTRIBUTION_CREATED'], 
      required: true 
    },
    sessionReference: { type: String, default: '' },
    sourceCode: { type: String, default: '' },
  },
  { timestamps: true }
);

export const ReferralEvent = mongoose.model('ReferralEvent', referralEventSchema);
