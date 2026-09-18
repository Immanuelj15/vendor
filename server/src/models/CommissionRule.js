import mongoose from 'mongoose';

const commissionRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    commissionType: { type: String, enum: ['PERCENTAGE', 'FIXED'], required: true },
    rate: { type: Number, default: 0 },
    fixedAmount: { type: Number, default: 0 },
    basis: { 
      type: String, 
      enum: ['SUBORDER_TOTAL', 'ITEM_SUBTOTAL', 'SUBTOTAL_EXCLUDING_TAX'], 
      default: 'SUBORDER_TOTAL' 
    },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    effectiveFrom: { type: Date, required: true, default: Date.now },
    effectiveUntil: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const CommissionRule = mongoose.model('CommissionRule', commissionRuleSchema);
