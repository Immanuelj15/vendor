import { superCoinService } from '../services/superCoinService.js';
import { SuperCoinWallet } from '../models/SuperCoinWallet.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const getWallet = asyncWrapper(async (req, res) => {
  const wallet = await superCoinService.getOrCreateWallet(req.user._id);
  return res.status(200).json(new ApiResponse(200, { wallet }, 'Super Coin wallet retrieved'));
});

export const getHistory = asyncWrapper(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  const data = await superCoinService.getTransactions(req.user._id, { page, limit });
  return res.status(200).json(new ApiResponse(200, data, 'Super Coin history retrieved'));
});
