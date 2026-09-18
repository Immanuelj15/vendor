import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const priceService = {
  /**
   * Determine the actual selling price, stock, SKU, and variant info for a product.
   * @param {Object} product - Product document from database
   * @param {String} variantSku - Selected variant SKU (optional)
   * @returns {Object} Pricing details
   */
  getEffectiveProductPrice(product, variantSku = '') {
    if (!product) {
      throw new ApiError(404, 'Product not found', ERROR_CODES.NOT_FOUND);
    }

    // Default to base product pricing
    let originalPrice = product.price;
    let discountPrice = product.discountPrice || 0;
    let sellingPrice = discountPrice > 0 ? discountPrice : originalPrice;
    let stock = product.stock;
    let sku = product.sku;
    let variantName = '';

    // If variant SKU is provided, search variants array
    if (variantSku && product.variants && product.variants.length > 0) {
      const variant = product.variants.find((v) => v.sku === variantSku);
      if (variant) {
        originalPrice = variant.price;
        discountPrice = variant.discountPrice || 0;
        sellingPrice = discountPrice > 0 ? discountPrice : originalPrice;
        stock = variant.stock;
        sku = variant.sku;
        variantName = variant.name;
      }
    }

    return {
      price: originalPrice,
      discountPrice,
      sellingPrice,
      stock,
      sku,
      variantName,
    };
  },
};
