import { mlmRewardService } from '../services/mlmRewardService.js';
import { TeamMessage } from '../models/TeamMessage.js';
import { Referral } from '../models/Referral.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import mongoose from 'mongoose';

export const getReferralLink = asyncWrapper(async (req, res) => {
  const referralCode = req.user.referralCode;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const referralLink = `${clientUrl}/register?ref=${referralCode}`;

  return res.status(200).json(
    new ApiResponse(
      200,
      { referralCode, referralLink },
      'Referral code and link generated'
    )
  );
});

export const getReferralTree = asyncWrapper(async (req, res) => {
  let targetUserId = req.user._id;
  const { userId, maxLevel } = req.query;

  if (userId && userId !== req.user._id.toString()) {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      throw new ApiError(403, 'Access denied: You are not authorized to view another user\'s network tree', ERROR_CODES.FORBIDDEN);
    }
    targetUserId = userId;
  }

  const parsedMaxLevel = Math.min(9, Math.max(1, parseInt(maxLevel) || 9));

  const treeData = await mlmRewardService.buildReferralTree(targetUserId, parsedMaxLevel);
  return res.status(200).json(new ApiResponse(200, treeData, 'Multi-level referral tree retrieved'));
});

export const getNetworkSummary = asyncWrapper(async (req, res) => {
  let targetUserId = req.user._id;
  const { userId } = req.query;

  if (userId && userId !== req.user._id.toString()) {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      throw new ApiError(403, 'Access denied: You are not authorized to view another user\'s network summary', ERROR_CODES.FORBIDDEN);
    }
    targetUserId = userId;
  }

  const summary = await Referral.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(targetUserId), level: { $lte: 9 } } },
    { $group: { _id: '$level', count: { $sum: 1 } } }
  ]);

  const stats = {
    totalNetworkCount: 0
  };
  for (let i = 1; i <= 9; i++) {
    stats[`level${i}Count`] = 0;
  }

  for (const item of summary) {
    const lvl = item._id;
    if (lvl >= 1 && lvl <= 9) {
      stats[`level${lvl}Count`] = item.count;
      stats.totalNetworkCount += item.count;
    }
  }

  return res.status(200).json(new ApiResponse(200, stats, 'Referral network summary retrieved successfully'));
});

export const sendTeamMessage = asyncWrapper(async (req, res) => {
  const { title, message } = req.body;
  const msg = await TeamMessage.create({
    senderUserId: req.user._id,
    title,
    message,
    targetLevel: 1,
  });

  return res.status(201).json(new ApiResponse(201, { message: msg }, 'Broadcast message sent to your downline team'));
});

export const getTeamMessages = asyncWrapper(async (req, res) => {
  // Find user's upline sponsors
  const referralsObj = await Referral.find({ referredUserId: req.user._id });
  const sponsorIds = referralsObj.map((r) => r.userId);

  const messages = await TeamMessage.find({ senderUserId: { $in: sponsorIds } })
    .sort({ createdAt: -1 })
    .populate('senderUserId', 'name referralCode email');

  return res.status(200).json(new ApiResponse(200, { messages }, 'Team messages retrieved'));
});
