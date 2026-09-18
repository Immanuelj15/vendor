import { SpinWheel } from '../models/SpinWheel.js';
import { SpinHistory } from '../models/SpinHistory.js';
import { SpinAttempt } from '../models/SpinAttempt.js';
import { User } from '../models/User.js';
import { fairCoinService } from './fairCoinService.js';
import { superCoinService } from './superCoinService.js';
import { premiumService } from './premiumService.js';
import { notificationService } from './notificationService.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const spinService = {
  async getActiveWheel() {
    let wheel = await SpinWheel.findOne({ isActive: true });

    // Seed default spin wheel if none exists
    if (!wheel) {
      wheel = await SpinWheel.create({
        title: 'Daily FairKart Spin & Win',
        description: 'Spin the wheel every day to win instant Fair Coins, Super Coins & Coupons!',
        isActive: true,
        requiresPremium: false,
        dailySpinsPerUser: 1,
        coinsRequiredPerSpin: 0,
        rewards: [
          { title: '10 Fair Coins', type: 'FAIR_COINS', value: 10, probability: 30, color: '#22c55e' },
          { title: '50 Super Coins', type: 'SUPER_COINS', value: 50, probability: 10, color: '#3b82f6' },
          { title: '50 Fair Coins', type: 'FAIR_COINS', value: 50, probability: 15, color: '#8b5cf6' },
          { title: '100 Super Coins', type: 'SUPER_COINS', value: 100, probability: 5, color: '#ec4899' },
          { title: 'Try Again', type: 'TRY_AGAIN', value: 0, probability: 40, color: '#64748b' },
        ],
      });
    }

    return wheel;
  },

  async checkUserEligibility(userId, wheel) {
    if (wheel.requiresPremium) {
      const isPremium = await premiumService.isCustomerPremium(userId);
      if (!isPremium) {
        throw new ApiError(403, 'This spin wheel is exclusive to Premium members.', ERROR_CODES.FORBIDDEN);
      }
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todaySpinsCount = await SpinHistory.countDocuments({
      userId,
      wheelId: wheel._id,
      createdAt: { $gte: startOfDay },
    });

    return {
      eligible: todaySpinsCount < wheel.dailySpinsPerUser,
      spinsRemaining: Math.max(0, wheel.dailySpinsPerUser - todaySpinsCount),
      todaySpinsCount,
    };
  },

  selectWeightedReward(rewards) {
    const totalWeight = rewards.reduce((sum, r) => sum + (r.probability || 0), 0);
    if (totalWeight <= 0) return { reward: rewards[0], index: 0 };
    
    let random = Math.random() * totalWeight;

    for (let i = 0; i < rewards.length; i++) {
      if (random < rewards[i].probability) {
        return { reward: rewards[i], index: i };
      }
      random -= rewards[i].probability;
    }

    return { reward: rewards[0], index: 0 };
  },

  async processSpin(userId, idempotencyKey) {
    if (!idempotencyKey) throw new ApiError(400, 'Idempotency key is required', ERROR_CODES.BAD_REQUEST);

    const wheel = await this.getActiveWheel();
    
    // Attempt to register idempotency lock
    let attempt;
    try {
      attempt = await SpinAttempt.create({
        userId,
        wheelId: wheel._id,
        idempotencyKey
      });
    } catch (e) {
      if (e.code === 11000) {
        throw new ApiError(409, 'Duplicate spin request detected. Please refresh.', ERROR_CODES.CONFLICT);
      }
      throw e;
    }

    try {
      const { eligible } = await this.checkUserEligibility(userId, wheel);

      if (!eligible) {
        attempt.status = 'FAILED';
        await attempt.save();
        throw new ApiError(400, 'Daily spin limit reached. Please try again tomorrow!', ERROR_CODES.BAD_REQUEST);
      }

      // If wheel requires coins per spin, validate and debit coins
      if (wheel.coinsRequiredPerSpin > 0) {
        const currentUser = await User.findById(userId);
        if (!currentUser || currentUser.fairCoinBalance < wheel.coinsRequiredPerSpin) {
          attempt.status = 'FAILED';
          await attempt.save();
          throw new ApiError(400, `Insufficient Fair Coins. You need ${wheel.coinsRequiredPerSpin} Fair Coins to spin.`, ERROR_CODES.BAD_REQUEST);
        }

        await fairCoinService.debitCoins({
          userId,
          amount: wheel.coinsRequiredPerSpin,
          type: 'DEBIT',
          source: 'SPIN_WHEEL_FEE',
          description: `Used ${wheel.coinsRequiredPerSpin} Fair Coins for Daily Spin`,
        });
      }

      // Backend weighted selection
      const { reward, index } = this.selectWeightedReward(wheel.rewards);

      // Record SpinHistory
      const history = await SpinHistory.create({
        userId,
        wheelId: wheel._id,
        rewardId: reward._id,
        rewardTitle: reward.title,
        rewardType: reward.type,
        rewardValue: reward.value,
        probabilitySnapshot: reward.probability,
      });

      // Update attempt
      attempt.status = 'COMPLETED';
      attempt.rewardId = reward._id;
      await attempt.save();

      // Credit coins if winning segment has coins
      if (reward.type === 'FAIR_COINS' && reward.value > 0) {
        await fairCoinService.creditCoins({
          userId,
          amount: reward.value,
          type: 'SPIN_REWARD',
          source: 'SPIN_WHEEL',
          referenceId: history._id.toString(),
          description: `Won ${reward.value} Fair Coins on Spin Wheel`,
        });
      }

      if (reward.type === 'SUPER_COINS' && reward.value > 0) {
        await superCoinService.creditCoins({
          userId,
          amount: reward.value,
          type: 'SPIN_REWARD',
          source: 'SPIN_WHEEL',
          referenceId: history._id.toString(),
          description: `Won ${reward.value} Super Coins on Spin Wheel`,
        });
      }

      // Notify user of spin reward
      try {
        await notificationService.createNotification({
          userId,
          title: 'Spin Wheel Reward Won!',
          message: `Congratulations! You won: ${reward.title}`,
          type: 'SPIN_REWARD',
          link: '/account/spin'
        }, { dedupeKey: `${history._id.toString()}:SPIN_REWARD` });
      } catch (err) {
        console.error('Failed to notify spin reward:', err);
      }

      const updatedUser = await User.findById(userId).select('fairCoinBalance superCoinBalance');

      return {
        winningSegmentIndex: index,
        reward: {
          title: reward.title,
          type: reward.type,
          value: reward.value,
          color: reward.color,
        },
        historyId: history._id,
        newCoinBalance: updatedUser ? updatedUser.fairCoinBalance : 0,
        newSuperCoinBalance: updatedUser ? updatedUser.superCoinBalance : 0,
      };
    } catch (e) {
      if (attempt.status === 'PENDING') {
        attempt.status = 'FAILED';
        await attempt.save();
      }
      throw e;
    }
  },
};
