import mongoose from 'mongoose';

const stockTransactionSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null, index: true },
    suborderId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorOrder', default: null },
    quantityChange: { type: Number, required: true },
    transactionType: { 
      type: String, 
      enum: ['PURCHASE', 'RESTOCK', 'RETURN', 'MANUAL_ADJUSTMENT'], 
      required: true 
    },
  },
  { timestamps: true }
);

export const StockTransaction = mongoose.model('StockTransaction', stockTransactionSchema);
export default StockTransaction;
