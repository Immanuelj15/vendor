import mongoose from 'mongoose';

const networkCommissionRuleSchema = new mongoose.Schema(
  {
    level: { type: Number, required: true, min: 1, max: 9, unique: true },
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
  },
  { timestamps: true }
);

export const NetworkCommissionRule = mongoose.model('NetworkCommissionRule', networkCommissionRuleSchema);
