import { CoinTransaction } from '../models/CoinTransaction.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import { notificationService } from './notificationService.js';

export const fairCoinService = {
  /**
   * Retrieves Fair Coins summary for a user (without touching the fiat Wallet collection).
   */
  async getOrCreateWallet(userId) {
    const user = await User.findById(userId).select('fairCoinBalance');
    if (!user) {
      throw new ApiError(404, 'User not found', ERROR_CODES.NOT_FOUND);
    }

    // Aggregate lifetime earned and spent from CoinTransactions
    const [earnedAgg, spentAgg] = await Promise.all([
      CoinTransaction.aggregate([
        { $match: { userId: user._id, type: { $in: ['REFERRAL_REWARD', 'PURCHASE_REWARD', 'BONUS', 'SPIN_REWARD', 'CREDIT'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      CoinTransaction.aggregate([
        { $match: { userId: user._id, type: 'DEBIT' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalEarned = earnedAgg[0]?.total || user.fairCoinBalance;
    const totalSpent = spentAgg[0]?.total || 0;

    return {
      userId: user._id,
      balance: user.fairCoinBalance || 0,
      totalEarned,
      totalSpent,
    };
  },

  /**
   * Credits Fair Coins exclusively to User.fairCoinBalance and logs to CoinTransaction.
   */
  async creditCoins({ userId, amount, type = 'CREDIT', source, referenceId = '', description = '' }) {
    if (typeof amount !== 'number' || amount <= 0) return null;

    const roundedAmount = Math.round(amount);

    // Atomically increment user's fairCoinBalance
    const userBefore = await User.findById(userId).select('fairCoinBalance');
    if (!userBefore) {
      throw new ApiError(404, 'User not found', ERROR_CODES.NOT_FOUND);
    }

    const balanceBefore = userBefore.fairCoinBalance || 0;
    const balanceAfter = balanceBefore + roundedAmount;

    await User.findByIdAndUpdate(userId, {
      $inc: { fairCoinBalance: roundedAmount },
    });

    const transaction = await CoinTransaction.create({
      userId,
      type,
      amount: roundedAmount,
      balanceBefore,
      balanceAfter,
      source,
      referenceId,
      description,
      status: 'COMPLETED',
    });

    try {
      await notificationService.createNotification(
        {
          userId,
          title: 'Fair Coins Credited',
          message: description || `You earned ${roundedAmount} Fair Coins.`,
          type: 'COIN_EARNED',
          link: '/account/fair-coins',
        },
        { dedupeKey: `${transaction._id.toString()}:COIN_CREDITED` }
      );
    } catch (err) {
      console.error('Failed to notify coin credit:', err);
    }

    return transaction;
  },

  /**
   * Debits Fair Coins exclusively from User.fairCoinBalance and logs to CoinTransaction.
   */
  async debitCoins({ userId, amount, type = 'DEBIT', source, referenceId = '', description = '' }) {
    if (typeof amount !== 'number' || amount <= 0) return null;

    const roundedAmount = Math.round(amount);

    // Atomic conditional decrement to prevent race conditions and negative coin balance
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        fairCoinBalance: { $gte: roundedAmount },
      },
      {
        $inc: { fairCoinBalance: -roundedAmount },
      },
      { new: true }
    );

    if (!updatedUser) {
      throw new ApiError(400, 'Insufficient Fair Coins balance', ERROR_CODES.BAD_REQUEST);
    }

    const balanceAfter = updatedUser.fairCoinBalance;
    const balanceBefore = balanceAfter + roundedAmount;

    const transaction = await CoinTransaction.create({
      userId,
      type,
      amount: roundedAmount,
      balanceBefore,
      balanceAfter,
      source,
      referenceId,
      description,
      status: 'COMPLETED',
    });

    try {
      await notificationService.createNotification(
        {
          userId,
          title: 'Fair Coins Redeemed',
          message: description || `You redeemed ${roundedAmount} Fair Coins.`,
          type: 'FAIR_COINS',
          link: '/account/fair-coins',
        },
        { dedupeKey: `${transaction._id.toString()}:COIN_DEBITED` }
      );
    } catch (err) {
      console.error('Failed to notify coin debit:', err);
    }

    return transaction;
  },

  /**
   * Retrieves paginated CoinTransactions for a user.
   */
  async getTransactions(userId, { page = 1, limit = 20 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      CoinTransaction.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      CoinTransaction.countDocuments({ userId }),
    ]);

    return {
      transactions,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
    };
  },

  /**
   * Processes post-purchase Fair Coins rewards.
   */
  async processPurchaseReward(userId, orderId, totalPurchaseAmount) {
    const orderNumberStr = orderId.toString();

    // Idempotency check: prevent duplicate reward for the same order
    const existingTx = await CoinTransaction.findOne({
      userId,
      referenceId: orderNumberStr,
      type: 'PURCHASE_REWARD',
    });
    if (existingTx) {
      return;
    }

    const { campaignService } = await import('./campaignService.js');
    const multiplier = await campaignService.evaluateCampaign('PURCHASE_BOOST');

    // 1 Fair Coin per ₹100 spent
    const baseCoins = Math.floor(totalPurchaseAmount / 100);
    const earnedCoins = baseCoins * multiplier;

    if (earnedCoins > 0) {
      const multiplierText = multiplier > 1 ? ` (${multiplier}x Campaign Boost)` : '';
      await this.creditCoins({
        userId,
        amount: earnedCoins,
        type: 'PURCHASE_REWARD',
        source: 'PRODUCT_PURCHASE',
        referenceId: orderNumberStr,
        description: `Earned ${earnedCoins} Fair Coins for order #${orderNumberStr}${multiplierText}`,
      });
    }
  },
};
