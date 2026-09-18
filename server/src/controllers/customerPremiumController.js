import { CustomerSubscriptionPlan } from '../models/CustomerSubscriptionPlan.js';
import { CustomerSubscription } from '../models/CustomerSubscription.js';
import { premiumService } from '../services/premiumService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const getPlans = asyncWrapper(async (req, res) => {
  const plans = await CustomerSubscriptionPlan.find({ status: 'ACTIVE' });
  return res.status(200).json(new ApiResponse(200, { plans }, 'Premium plans retrieved'));
});

export const subscribe = asyncWrapper(async (req, res) => {
  const { planId } = req.body;
  if (!planId) throw new ApiError(400, 'planId is required', ERROR_CODES.BAD_REQUEST);

  const subscription = await premiumService.createSubscriptionRequest(req.user._id, planId);
  
  return res.status(201).json(new ApiResponse(201, { subscription }, 'Subscription request created'));
});

export const getStatus = asyncWrapper(async (req, res) => {
  const subscription = await CustomerSubscription.findOne({
    customerId: req.user._id,
    status: 'ACTIVE',
    expiresAt: { $gt: new Date() }
  }).populate('planId');

  const isPremium = !!subscription;
  
  return res.status(200).json(new ApiResponse(200, { isPremium, subscription }, 'Premium status retrieved'));
});

export const getHistory = asyncWrapper(async (req, res) => {
  const history = await CustomerSubscription.find({ customerId: req.user._id })
    .sort({ createdAt: -1 })
    .populate('planId');
    
  return res.status(200).json(new ApiResponse(200, { history }, 'Subscription history retrieved'));
});
