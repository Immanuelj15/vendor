import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    type: { type: String, enum: ['PERCENTAGE', 'FIXED'], required: true },
    discountValue: { type: Number, required: true }, // e.g. 10 (%) or 100 (₹)
    minPurchase: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 }, // For percentage coupons
    usageLimit: { type: Number, default: 1000 },
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Coupon = mongoose.model('Coupon', couponSchema);
