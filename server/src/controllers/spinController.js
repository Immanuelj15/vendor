import { spinService } from '../services/spinService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

export const getWheelConfig = asyncWrapper(async (req, res) => {
  const wheel = await spinService.getActiveWheel();
  const eligibility = await spinService.checkUserEligibility(req.user._id, wheel);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        wheel: {
          _id: wheel._id,
          title: wheel.title,
          description: wheel.description,
          rewards: wheel.rewards,
          coinsRequiredPerSpin: wheel.coinsRequiredPerSpin || 0,
          dailySpinsPerUser: wheel.dailySpinsPerUser || 1,
          requiresPremium: !!wheel.requiresPremium,
        },
        eligibility,
      },
      'Spin Wheel config retrieved'
    )
  );
});

export const spinWheel = asyncWrapper(async (req, res) => {
  const { idempotencyKey } = req.body;
  const spinResult = await spinService.processSpin(req.user._id, idempotencyKey);
  return res.status(200).json(new ApiResponse(200, spinResult, 'Spin processed successfully'));
});
