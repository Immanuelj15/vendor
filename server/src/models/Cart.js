import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  variantSku: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
});

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: [cartItemSchema],
    couponCode: { type: String, default: '' },
    discountAmount: { type: Number, default: 0 },
    fairCoinsUsed: { type: Number, default: 0 },
    coinDiscountAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Cart = mongoose.model('Cart', cartSchema);
