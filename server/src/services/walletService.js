import mongoose from 'mongoose';
import { Wallet } from '../models/Wallet.js';
import { WalletTransaction } from '../models/WalletTransaction.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import { moneyUtils } from '../utils/moneyUtils.js';

export const walletService = {
  /**
   * Retrieves or creates a fiat wallet for a user.
   */
  async getOrCreateWallet(userId, session = null) {
    const opts = session ? { session } : {};
    let wallet = await Wallet.findOne({ userId }, null, opts);
    if (!wallet) {
      const created = await Wallet.create(
        [{ userId, balance: 0, totalEarned: 0, totalSpent: 0 }],
        opts
      );
      wallet = created[0];
    }
    return wallet;
  },

  /**
   * Atomically credits fiat INR to a user's wallet with an immutable double-entry ledger record.
   */
  async creditWallet({
    userId,
    amount,
    type = 'COMMISSION_CREDIT',
    referenceId,
    referenceType = 'SUBSCRIPTION',
    description = '',
    metadata = {},
    session = null,
  }) {
    if (typeof amount !== 'number' || amount <= 0) {
      throw new ApiError(400, 'Credit amount must be greater than zero', ERROR_CODES.BAD_REQUEST);
    }

    const roundedAmount = moneyUtils.roundMoney(amount);
    const opts = session ? { session } : {};

    // Ensure wallet exists
    const currentWallet = await this.getOrCreateWallet(userId, session);
    const balanceBefore = currentWallet.balance;
    const balanceAfter = moneyUtils.addMoney(balanceBefore, roundedAmount);

    // Atomic increment
    const updatedWallet = await Wallet.findByIdAndUpdate(
      currentWallet._id,
      {
        $inc: {
          balance: roundedAmount,
          totalEarned: roundedAmount,
        },
      },
      { new: true, ...opts }
    );

    // Create immutable WalletTransaction ledger record
    const transaction = await WalletTransaction.create(
      [
        {
          walletId: updatedWallet._id,
          userId,
          type,
          direction: 'CREDIT',
          amount: roundedAmount,
          currency: 'INR',
          balanceBefore,
          balanceAfter: updatedWallet.balance,
          referenceId: referenceId ? referenceId.toString() : `REF-${Date.now()}`,
          referenceType,
          description: description || `Credited ₹${roundedAmount}`,
          metadata,
        },
      ],
      opts
    );

    return { wallet: updatedWallet, transaction: transaction[0] };
  },

  /**
   * Atomically debits fiat INR from a user's wallet with concurrency checks and an immutable ledger record.
   */
  async debitWallet({
    userId,
    amount,
    type = 'WITHDRAWAL_DEBIT',
    referenceId,
    referenceType = 'PAYOUT',
    description = '',
    metadata = {},
    session = null,
  }) {
    if (typeof amount !== 'number' || amount <= 0) {
      throw new ApiError(400, 'Debit amount must be greater than zero', ERROR_CODES.BAD_REQUEST);
    }

    const roundedAmount = moneyUtils.roundMoney(amount);
    const opts = session ? { session } : {};

    const currentWallet = await this.getOrCreateWallet(userId, session);
    const balanceBefore = currentWallet.balance;

    if (balanceBefore < roundedAmount) {
      throw new ApiError(400, 'Insufficient wallet balance', ERROR_CODES.BAD_REQUEST);
    }

    // Atomic conditional decrement to prevent race conditions & negative balances
    const updatedWallet = await Wallet.findOneAndUpdate(
      {
        _id: currentWallet._id,
        balance: { $gte: roundedAmount },
      },
      {
        $inc: {
          balance: -roundedAmount,
          totalSpent: roundedAmount,
        },
      },
      { new: true, ...opts }
    );

    if (!updatedWallet) {
      throw new ApiError(400, 'Insufficient wallet balance during concurrent operation', ERROR_CODES.BAD_REQUEST);
    }

    const transaction = await WalletTransaction.create(
      [
        {
          walletId: updatedWallet._id,
          userId,
          type,
          direction: 'DEBIT',
          amount: roundedAmount,
          currency: 'INR',
          balanceBefore,
          balanceAfter: updatedWallet.balance,
          referenceId: referenceId ? referenceId.toString() : `REF-${Date.now()}`,
          referenceType,
          description: description || `Debited ₹${roundedAmount}`,
          metadata,
        },
      ],
      opts
    );

    return { wallet: updatedWallet, transaction: transaction[0] };
  },

  /**
   * Fetches the user's fiat wallet.
   */
  async getWallet(userId) {
    return await this.getOrCreateWallet(userId);
  },

  /**
   * Fetches paginated wallet transactions.
   */
  async getTransactions(userId, { page = 1, limit = 20, type = '' } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const query = { userId };
    if (type) query.type = type;

    const [transactions, total] = await Promise.all([
      WalletTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      WalletTransaction.countDocuments(query),
    ]);

    return {
      transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  },
};
