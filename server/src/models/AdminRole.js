import mongoose from 'mongoose';

const adminRoleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true, // e.g. 'FINANCE_ADMIN', 'SUPPORT_ADMIN'
    },
    description: {
      type: String,
      default: '',
    },
    permissions: [
      {
        type: String, // e.g. 'vendor.view', 'vendor.approve', 'payment.view'
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const AdminRole = mongoose.model('AdminRole', adminRoleSchema);
