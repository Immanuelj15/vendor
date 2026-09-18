import { vendorSubscriptionService } from '../services/vendorSubscriptionService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

export const getAvailablePlans = asyncWrapper(async (req, res) => {
  const plans = await vendorSubscriptionService.getAvailablePlans();
  return res.status(200).json(new ApiResponse(200, { plans }, 'Available plans retrieved'));
});

export const getCurrentSubscription = asyncWrapper(async (req, res) => {
  const subscription = await vendorSubscriptionService.getCurrentSubscription(req.user.vendorId);
  return res.status(200).json(new ApiResponse(200, { subscription }, 'Current subscription retrieved'));
});

export const createSubscriptionOrder = asyncWrapper(async (req, res) => {
  const { planId, billingCycle } = req.body;
  const order = await vendorSubscriptionService.createSubscriptionOrder(req.user.vendorId, planId, billingCycle);
  return res.status(201).json(new ApiResponse(201, { order }, 'Subscription order created'));
});

export const verifySubscriptionPayment = asyncWrapper(async (req, res) => {
  const { orderId, paymentId, paymentStatus } = req.body;
  const subscription = await vendorSubscriptionService.verifySubscriptionPayment(req.user.vendorId, orderId, paymentId, paymentStatus);
  return res.status(200).json(new ApiResponse(200, { subscription }, 'Payment verified and subscription activated'));
});

export const getSubscriptionHistory = asyncWrapper(async (req, res) => {
  const history = await vendorSubscriptionService.getSubscriptionHistory(req.user.vendorId);
  return res.status(200).json(new ApiResponse(200, { history }, 'Subscription history retrieved'));
});
