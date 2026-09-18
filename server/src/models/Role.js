import mongoose from 'mongoose';
import { ROLES } from '../constants/roles.js';

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: Object.values(ROLES),
    },
    permissions: [
      {
        type: String,
      },
    ],
    description: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export const Role = mongoose.model('Role', roleSchema);
