import { CustomerSubscriptionPlan } from '../models/CustomerSubscriptionPlan.js';
import { superCoinService } from '../services/superCoinService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const getPlans = asyncWrapper(async (req, res) => {
  const plans = await CustomerSubscriptionPlan.find({});
  return res.status(200).json(new ApiResponse(200, { plans }, 'Plans retrieved'));
});

export const createPlan = asyncWrapper(async (req, res) => {
  const plan = await CustomerSubscriptionPlan.create(req.body);
  return res.status(201).json(new ApiResponse(201, { plan }, 'Plan created'));
});

export const updatePlan = asyncWrapper(async (req, res) => {
  const plan = await CustomerSubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!plan) throw new ApiError(404, 'Plan not found', ERROR_CODES.NOT_FOUND);
  return res.status(200).json(new ApiResponse(200, { plan }, 'Plan updated'));
});

export const adjustSuperCoins = asyncWrapper(async (req, res) => {
  const { amount, reason } = req.body;
  if (!amount || !reason) throw new ApiError(400, 'Amount and reason are required', ERROR_CODES.BAD_REQUEST);

  let transaction;
  if (amount > 0) {
    transaction = await superCoinService.creditCoins({
      userId: req.params.id,
      amount: Math.abs(amount),
      type: 'ADMIN_ADJUSTMENT',
      source: 'ADMIN',
      description: reason,
      referenceId: req.user._id.toString()
    });
  } else {
    transaction = await superCoinService.debitCoins({
      userId: req.params.id,
      amount: Math.abs(amount),
      type: 'ADMIN_ADJUSTMENT',
      source: 'ADMIN',
      description: reason,
      referenceId: req.user._id.toString()
    });
  }

  return res.status(200).json(new ApiResponse(200, { transaction }, 'Super Coins adjusted'));
});
