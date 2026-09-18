import mongoose from 'mongoose';

const adminNoteSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, required: true },
  },
  { timestamps: true }
);

export const AdminNote = mongoose.model('AdminNote', adminNoteSchema);
