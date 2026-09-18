import { CustomerSubscriptionPlan } from '../models/CustomerSubscriptionPlan.js';
import { CustomerSubscription } from '../models/CustomerSubscription.js';
import { Payment } from '../models/Payment.js';
import { fairCoinService } from './fairCoinService.js';
import { superCoinService } from './superCoinService.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const premiumService = {
  
  async createSubscriptionRequest(userId, planId) {
    const plan = await CustomerSubscriptionPlan.findById(planId);
    if (!plan || plan.status !== 'ACTIVE') {
      throw new ApiError(400, 'Invalid or inactive plan', ERROR_CODES.BAD_REQUEST);
    }

    const activeSubscription = await CustomerSubscription.findOne({
      customerId: userId,
      status: 'ACTIVE',
      expiresAt: { $gt: new Date() }
    });

    if (activeSubscription) {
      throw new ApiError(400, 'Customer already has an active premium subscription', ERROR_CODES.BAD_REQUEST);
    }

    const subscription = await CustomerSubscription.create({
      customerId: userId,
      planId: plan._id,
      status: 'PENDING',
      planSnapshot: plan.toObject()
    });

    return subscription;
  },

  async activateSubscription(paymentId, session = null) {
    let paymentQuery = Payment.findById(paymentId);
    if (session) paymentQuery = paymentQuery.session(session);
    const payment = await paymentQuery;
    if (!payment || !payment.customerSubscriptionId) return;

    if (payment.status !== 'SUCCESS' && payment.status !== 'CAPTURED') return;

    let subQuery = CustomerSubscription.findById(payment.customerSubscriptionId);
    if (session) subQuery = subQuery.session(session);
    const subscription = await subQuery;
    if (!subscription || subscription.status === 'ACTIVE') return;

    const plan = subscription.planSnapshot;

    // Calculate Dates
    const startDate = new Date();
    const expiryDate = new Date(startDate);
    if (plan.durationUnit === 'MONTH') {
      expiryDate.setMonth(expiryDate.getMonth() + plan.durationValue);
    } else if (plan.durationUnit === 'YEAR') {
      expiryDate.setFullYear(expiryDate.getFullYear() + plan.durationValue);
    } else if (plan.durationUnit === 'DAY') {
      expiryDate.setDate(expiryDate.getDate() + plan.durationValue);
    }

    subscription.status = 'ACTIVE';
    subscription.startedAt = startDate;
    subscription.expiresAt = expiryDate;
    subscription.paymentId = payment._id;
    subscription.autoRenew = true;
    if (session) {
      await subscription.save({ session });
    } else {
      await subscription.save();
    }

    // Issue Rewards
    if (plan.rewardRules?.coinsOnSubscribe > 0) {
      await fairCoinService.creditCoins({
        userId: subscription.customerId,
        amount: plan.rewardRules.coinsOnSubscribe,
        type: 'BONUS',
        source: 'PREMIUM_SUBSCRIPTION',
        referenceId: subscription._id.toString(),
        description: `Premium Activation Bonus: ${plan.name}`
      });
    }

    if (plan.rewardRules?.superCoinsOnSubscribe > 0) {
      await superCoinService.creditCoins({
        userId: subscription.customerId,
        amount: plan.rewardRules.superCoinsOnSubscribe,
        type: 'BONUS',
        source: 'PREMIUM_SUBSCRIPTION',
        referenceId: subscription._id.toString(),
        description: `Premium Activation Bonus: ${plan.name}`
      });
    }

    return subscription;
  },

  async renewSubscription(userId, planId) {
    const plan = await CustomerSubscriptionPlan.findById(planId);
    if (!plan || plan.status !== 'ACTIVE') throw new ApiError(400, 'Invalid plan', ERROR_CODES.BAD_REQUEST);

    const currentSubscription = await CustomerSubscription.findOne({
      customerId: userId,
      status: 'ACTIVE',
    });

    const subscription = await CustomerSubscription.create({
      customerId: userId,
      planId: plan._id,
      status: 'PENDING',
      planSnapshot: plan.toObject(),
      // Track previous sub to extend date nicely post payment if needed
    });

    return subscription;
  },

  async isCustomerPremium(userId) {
    const subscription = await CustomerSubscription.findOne({
      customerId: userId,
      status: 'ACTIVE',
      expiresAt: { $gt: new Date() }
    });
    return !!subscription;
  }
};
