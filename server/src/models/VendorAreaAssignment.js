import mongoose from 'mongoose';

const vendorAreaAssignmentSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    stateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Territory',
      required: true,
    },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Territory',
      required: true,
    },
    areaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Territory',
      required: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const VendorAreaAssignment = mongoose.model('VendorAreaAssignment', vendorAreaAssignmentSchema);
