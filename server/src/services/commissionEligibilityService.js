import { User } from '../models/User.js';
import { Shop } from '../models/Shop.js';
import { Order } from '../models/Order.js';
import { CustomerShopAttribution } from '../models/CustomerShopAttribution.js';
import { mlmRewardService } from './mlmRewardService.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const commissionEligibilityService = {
  /**
   * Identifies what shop is currently permanently attributed to a customer
   * @param {string} customerId 
   * @returns {Promise<Object|null>} Shop document or null
   */
  async getAttributedShop(customerId) {
    const attribution = await CustomerShopAttribution.findOne({ customerUserId: customerId, status: 'ACTIVE' });
    if (!attribution) return null;
    return await Shop.findById(attribution.shopId);
  },

  /**
   * Identifies the direct sponsor/referrer of a customer
   * @param {string} customerId 
   * @returns {Promise<Object|null>} Sponsor User document or null
   */
  async getSponsor(customerId) {
    const user = await User.findById(customerId);
    if (!user || !user.referredBy) return null;
    return await User.findById(user.referredBy);
  },

  /**
   * Retrieves the 9 levels of MLM ancestors of a customer
   * @param {string} customerId 
   * @returns {Promise<Array>} List of { level, user } ancestors
   */
  async get9Ancestors(customerId) {
    return await mlmRewardService.getUpline(customerId, 9);
  },

  /**
   * Checks if an order is eligible for MLM network commission payout
   * @param {string} orderId 
   * @returns {Promise<Object>} { eligible: boolean, reason?: string }
   */
  async isEligibleForNetworkCommission(orderId) {
    const order = await Order.findById(orderId);
    if (!order) {
      return { eligible: false, reason: 'ORDER_NOT_FOUND' };
    }

    const user = await User.findById(order.userId);
    if (!user || !user.referredBy) {
      return { eligible: false, reason: 'NO_SPONSOR_FOUND' };
    }

    const validStatuses = ['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'];
    if (!validStatuses.includes(order.orderStatus)) {
      return { eligible: false, reason: `INVALID_ORDER_STATUS: ${order.orderStatus}` };
    }

    if (order.total <= 0) {
      return { eligible: false, reason: 'ORDER_AMOUNT_IS_ZERO_OR_LESS' };
    }

    return { eligible: true };
  },

  /**
   * Checks if an order is eligible for shop attribution commission payout
   * @param {string} orderId 
   * @returns {Promise<Object>} { eligible: boolean, reason?: string }
   */
  async isEligibleForShopCommission(orderId) {
    const order = await Order.findById(orderId);
    if (!order) {
      return { eligible: false, reason: 'ORDER_NOT_FOUND' };
    }

    if (!order.attributedShopId) {
      return { eligible: false, reason: 'NO_SHOP_ATTRIBUTION_FOUND' };
    }

    const shop = await Shop.findById(order.attributedShopId);
    if (!shop || shop.status !== 'ACTIVE') {
      return { eligible: false, reason: 'ATTRIBUTED_SHOP_INACTIVE_OR_NOT_FOUND' };
    }

    const validStatuses = ['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'];
    if (!validStatuses.includes(order.orderStatus)) {
      return { eligible: false, reason: `INVALID_ORDER_STATUS: ${order.orderStatus}` };
    }

    return { eligible: true };
  }
};
