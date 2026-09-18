import { SuperCoinWallet } from '../models/SuperCoinWallet.js';
import { SuperCoinTransaction } from '../models/SuperCoinTransaction.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const superCoinService = {
  async getOrCreateWallet(userId) {
    let wallet = await SuperCoinWallet.findOne({ userId });
    if (!wallet) {
      wallet = await SuperCoinWallet.create({ userId, balance: 0, totalEarned: 0, totalSpent: 0 });
    }
    return wallet;
  },

  async creditCoins({ userId, amount, type, source, referenceId = '', description = '' }) {
    if (amount <= 0) return null;

    const wallet = await this.getOrCreateWallet(userId);

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore + amount;

    wallet.balance = balanceAfter;
    wallet.totalEarned += amount;
    await wallet.save();

    // Sync user model fast cached balance
    await User.findByIdAndUpdate(userId, { superCoinBalance: balanceAfter });

    const transaction = await SuperCoinTransaction.create({
      userId,
      type,
      amount,
      balanceBefore,
      balanceAfter,
      source,
      referenceId,
      description,
      status: 'COMPLETED',
    });

    return transaction;
  },

  async debitCoins({ userId, amount, type, source, referenceId = '', description = '' }) {
    if (amount <= 0) return null;

    const wallet = await this.getOrCreateWallet(userId);

    if (wallet.balance < amount) {
      throw new ApiError(400, 'Insufficient Super Coins balance', ERROR_CODES.BAD_REQUEST);
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore - amount;

    wallet.balance = balanceAfter;
    wallet.totalSpent += amount;
    await wallet.save();

    // Sync user model fast cached balance
    await User.findByIdAndUpdate(userId, { superCoinBalance: balanceAfter });

    const transaction = await SuperCoinTransaction.create({
      userId,
      type,
      amount,
      balanceBefore,
      balanceAfter,
      source,
      referenceId,
      description,
      status: 'COMPLETED',
    });

    return transaction;
  },

  async getTransactions(userId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const transactions = await SuperCoinTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await SuperCoinTransaction.countDocuments({ userId });
    return { transactions, total, page, pages: Math.ceil(total / limit) };
  }
};
