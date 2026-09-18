import mongoose from 'mongoose';

const vendorDocumentSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    identityDocumentType: { type: String, required: true }, // e.g. Aadhar, Voter ID
    identityDocumentNumber: { type: String, required: true },
    identityDocumentUpload: { type: String, required: true }, // URL/path
    identityDocumentStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
    identityDocumentReason: { type: String },

    panDocumentUpload: { type: String },
    panDocumentStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
    panDocumentReason: { type: String },

    gstCertificateUpload: { type: String },
    gstCertificateStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
    gstCertificateReason: { type: String },

    businessProofUpload: { type: String },
    businessProofStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
    businessProofReason: { type: String },
  },
  { timestamps: true }
);

export const VendorDocument = mongoose.model('VendorDocument', vendorDocumentSchema);
