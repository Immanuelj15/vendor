import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  sku: { type: String, required: true },
  name: { type: String, required: true }, // e.g. "Size: M, Color: Black"
  price: { type: Number, required: true },
  discountPrice: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  attributes: { type: Map, of: String },
});

const productSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', default: null, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, default: '' },
    shortDescription: { type: String, default: '' },
    images: [{ type: String }],
    mrp: { type: Number, required: true },
    price: { type: Number, required: true }, // Selling price
    discountType: { type: String, enum: ['PERCENTAGE', 'FIXED', 'NONE'], default: 'NONE' },
    discountValue: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    hsnCode: { type: String, default: '' },
    stock: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    weight: { type: Number, default: 0 },
    weightUnit: { type: String, enum: ['GRAM', 'KG', 'LBS', 'OZ', ''], default: '' },
    length: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    dimensionUnit: { type: String, enum: ['CM', 'INCH', 'METER', ''], default: '' },
    sku: { type: String, required: true, unique: true, index: true },
    variants: [variantSchema],
    coinReward: { type: Number, default: 10 }, // Fair Coins awarded on purchase
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ACTIVE', 'INACTIVE'],
      default: 'DRAFT',
      index: true,
    },
    isDeleted: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', tags: 'text' });

export const Product = mongoose.model('Product', productSchema);
export default Product;
