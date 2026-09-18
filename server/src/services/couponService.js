import { Coupon } from '../models/Coupon.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import { priceService } from './priceService.js';

export const couponService = {
  /**
   * Validate a coupon against cart items and user history.
   * @param {Object} params
   * @param {String} params.code - Coupon code
   * @param {String} params.userId - Logged in user ID
   * @param {Array} params.items - Cart items [{ productId, variantSku, quantity, price }]
   * @returns {Object} Coupon details, discountAmount, eligibleItems
   */
  async validateCoupon({ code, userId, items }) {
    if (!code) {
      throw new ApiError(400, 'Coupon code is required', ERROR_CODES.BAD_REQUEST);
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) {
      throw new ApiError(400, 'Invalid or inactive coupon code', ERROR_CODES.BAD_REQUEST);
    }

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      throw new ApiError(400, 'Coupon is not active or has expired', ERROR_CODES.BAD_REQUEST);
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      throw new ApiError(400, 'Coupon usage limit reached', ERROR_CODES.BAD_REQUEST);
    }

    // Check user-specific limit
    if (userId) {
      const userUsageCount = await Order.countDocuments({
        userId,
        couponCode: coupon.code,
        orderStatus: { $ne: 'CANCELLED' },
      });
      if (userUsageCount >= coupon.perUserLimit) {
        throw new ApiError(400, `You have already used this coupon the maximum allowed times (${coupon.perUserLimit})`, ERROR_CODES.BAD_REQUEST);
      }
    }

    // Determine eligible items and calculate totals
    let eligibleSubtotal = 0;
    let fullSubtotal = 0;
    const eligibleItems = [];

    // Populate products to check categories
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || product.status !== 'APPROVED') continue;

      const pricing = priceService.getEffectiveProductPrice(product, item.variantSku);
      const itemPrice = pricing.sellingPrice;
      const itemTotal = itemPrice * item.quantity;
      fullSubtotal += itemTotal;

      // Check category applicability
      let isEligible = true;
      if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
        isEligible = coupon.applicableCategories.some(
          (catId) => catId.toString() === product.categoryId.toString()
        );
      }

      if (isEligible) {
        eligibleSubtotal += itemTotal;
        eligibleItems.push({
          productId: item.productId,
          variantSku: item.variantSku,
          quantity: item.quantity,
          price: itemPrice,
        });
      }
    }

    if (eligibleSubtotal === 0) {
      throw new ApiError(400, 'None of the items in your cart are eligible for this coupon', ERROR_CODES.BAD_REQUEST);
    }

    // Check minimum purchase requirement
    if (fullSubtotal < coupon.minPurchase) {
      throw new ApiError(
        400,
        `Minimum order value of ₹${(coupon.minPurchase / 100).toFixed(2)} is required to apply this coupon`,
        ERROR_CODES.BAD_REQUEST
      );
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discountAmount = Math.round((eligibleSubtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount > 0 && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else if (coupon.type === 'FIXED') {
      discountAmount = coupon.discountValue;
    }

    // Ensure discount does not exceed eligible subtotal
    if (discountAmount > eligibleSubtotal) {
      discountAmount = eligibleSubtotal;
    }

    return {
      coupon,
      discountAmount,
      eligibleItems,
      message: 'Coupon is valid and applied successfully',
    };
  },

  /**
   * Concurrency-safe atomic usage incrementer.
   * @param {String} couponId - Coupon DB identifier
   * @param {Object} session - Mongoose transactional session (optional)
   */
  async incrementUsageAtomic(couponId, session = null) {
    const query = { _id: couponId };
    const options = { new: true };
    if (session) options.session = session;

    // Fetch the coupon to get its current limit dynamically
    const coupon = await Coupon.findById(couponId).session(session);
    if (!coupon) {
      throw new ApiError(404, 'Coupon not found', ERROR_CODES.NOT_FOUND);
    }

    // Atomically increment ONLY if usedCount is strictly less than usageLimit
    const updatedCoupon = await Coupon.findOneAndUpdate(
      { _id: couponId, usedCount: { $lt: coupon.usageLimit } },
      { $inc: { usedCount: 1 } },
      options
    );

    if (!updatedCoupon) {
      throw new ApiError(400, 'Coupon usage limit reached concurrently', ERROR_CODES.BAD_REQUEST);
    }

    return updatedCoupon;
  },
};
