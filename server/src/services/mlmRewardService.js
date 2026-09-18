import { User } from '../models/User.js';
import { Referral } from '../models/Referral.js';
import { ReferralReward } from '../models/ReferralReward.js';
import { Commission } from '../models/Commission.js';
import { Settings } from '../models/Settings.js';
import { Wallet } from '../models/Wallet.js';
import { Vendor } from '../models/Vendor.js';
import { PlatformLedger } from '../models/PlatformLedger.js';
import { fairCoinService } from './fairCoinService.js';
import { walletService } from './walletService.js';
import { notificationService } from './notificationService.js';

export const mlmRewardService = {
  async getMLMConfig() {
    const setting = await Settings.findOne({ key: 'MLM_COMMISSION_RATES' }) || await Settings.findOne({ key: 'MLM_CONFIG' });
    if (setting && setting.value) {
      if (Array.isArray(setting.value.levels)) return setting.value;
      if (Array.isArray(setting.value)) return { maxLevels: setting.value.length, levels: setting.value };
    }
    return {
      maxLevels: 9,
      levels: [
        { level: 1, percentage: 10, name: 'Level 1 (Direct)' },
        { level: 2, percentage: 5, name: 'Level 2' },
        { level: 3, percentage: 3, name: 'Level 3' },
        { level: 4, percentage: 2, name: 'Level 4' },
        { level: 5, percentage: 1, name: 'Level 5' },
        { level: 6, percentage: 1, name: 'Level 6' },
        { level: 7, percentage: 1, name: 'Level 7' },
        { level: 8, percentage: 1, name: 'Level 8' },
        { level: 9, percentage: 1, name: 'Level 9' },
      ],
    };
  },

  calculateLeadershipRank(directCount) {
    if (directCount >= 50) {
      return { rank: 'DIAMOND', title: 'Diamond Elite', multiplier: 1.5, badgeColor: '#eab308', nextRankAt: 100 };
    }
    if (directCount >= 15) {
      return { rank: 'GOLD', title: 'Gold Ambassador', multiplier: 1.25, badgeColor: '#fbbf24', nextRankAt: 50 };
    }
    if (directCount >= 5) {
      return { rank: 'SILVER', title: 'Silver Leader', multiplier: 1.1, badgeColor: '#94a3b8', nextRankAt: 15 };
    }
    return { rank: 'BRONZE', title: 'Bronze Partner', multiplier: 1.0, badgeColor: '#cd7f32', nextRankAt: 5 };
  },

  async getLeaderboard(limit = 10) {
    const leaderboard = await Referral.aggregate([
      { $match: { level: 1 } },
      { $group: { _id: '$userId', directCount: { $sum: 1 } } },
      { $sort: { directCount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          name: '$user.name',
          referralCode: '$user.referralCode',
          fairCoinBalance: '$user.fairCoinBalance',
          directCount: 1,
        },
      },
    ]);

    return leaderboard;
  },

  async processReferralRegistrationRewards(newUserId, referrerUserId) {
    if (!referrerUserId) return;

    const coinSettings = await Settings.findOne({ key: 'FAIR_COIN_RULES' });
    const baseReferralCoins = coinSettings?.value?.referralCoins || 50;
    const registrationCoins = coinSettings?.value?.registrationCoins || 100;

    // 1. Reward New User for joining
    await fairCoinService.creditCoins({
      userId: newUserId,
      amount: registrationCoins,
      type: 'REFERRAL_REWARD',
      source: 'NEW_USER_REGISTRATION',
      referenceId: newUserId.toString(),
      description: `Welcome Bonus: ${registrationCoins} Fair Coins`,
    });

    // 2. Build multi-level upline hierarchy
    const upline = await this.getUpline(newUserId, 9);

    for (const node of upline) {
      // Idempotently create or update Referral records
      await Referral.updateOne(
        { userId: node.user._id, referredUserId: newUserId },
        { $set: { level: node.level, status: 'ACTIVE' } },
        { upsert: true }
      );

      if (node.level === 1) {
        // Apply Rank Multiplier bonus to referrer!
        const directCount = await Referral.countDocuments({ userId: node.user._id, level: 1 });
        const rankInfo = this.calculateLeadershipRank(directCount);
        const finalCoins = Math.round(baseReferralCoins * rankInfo.multiplier);

        await fairCoinService.creditCoins({
          userId: node.user._id,
          amount: finalCoins,
          type: 'REFERRAL_REWARD',
          source: 'DIRECT_REFERRAL_JOINED',
          referenceId: newUserId.toString(),
          description: `Direct Referral Reward (${rankInfo.title} ${rankInfo.multiplier}x Multiplier)`,
        });

        await ReferralReward.create({
          userId: node.user._id,
          sourceUserId: newUserId,
          level: node.level,
          rewardType: 'FAIR_COINS',
          rewardValue: finalCoins,
          description: `Direct referral bonus for new sign up (${rankInfo.title})`,
        });

        // Notify sponsor
        try {
          await notificationService.createNotification({
            userId: node.user._id,
            title: 'New Referral Joined',
            message: `A new user has joined using your referral code.`,
            type: 'REFERRAL_JOINED',
            link: '/account/referrals'
          }, { dedupeKey: `${newUserId.toString()}:REFERRAL_JOINED` });
        } catch (err) {
          console.error('Failed to notify referrer:', err);
        }
      }
    }
  },

  async processPurchaseCommission(buyerUserId, orderId, orderTotal) {
    const mlmConfig = await this.getMLMConfig();
    const upline = await this.getUpline(buyerUserId, mlmConfig.maxLevels || 3);

    for (const node of upline) {
      const levelConfig = mlmConfig.levels.find((l) => l.level === node.level);
      if (levelConfig && levelConfig.percentage > 0) {
        const commissionAmount = Math.round((orderTotal * levelConfig.percentage) / 100);

        if (commissionAmount > 0) {
          const commission = await Commission.create({
            orderId,
            type: 'MLM_UPLINE_COMMISSION',
            recipientUserId: node.user._id,
            orderAmount: orderTotal,
            commissionPercentage: levelConfig.percentage,
            commissionAmount,
            status: 'PAID',
          });

          try {
            await notificationService.createNotification({
              userId: node.user._id,
              title: 'Commission Earned',
              message: `You earned ₹${(commissionAmount / 100).toFixed(2)} from referred purchase.`,
              type: 'COMMISSION_EARNED',
              link: '/account/commissions'
            }, { dedupeKey: `${commission._id.toString()}:COMMISSION_EARNED` });
          } catch (err) {
            console.error('Failed to notify commission:', err);
          }

          await fairCoinService.creditCoins({
            userId: node.user._id,
            amount: commissionAmount,
            type: 'BONUS',
            source: `MLM_LEVEL_${node.level}_PURCHASE_COMMISSION`,
            referenceId: orderId.toString(),
            description: `Level ${node.level} commission reward on referred purchase`,
          });
        }
      }
    }
  },

  async processVendorSubscriptionCommission(vendorId, subscriptionId, subscriptionAmount) {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor || !vendor.userId) return;

    const mlmConfig = await this.getMLMConfig();
    const upline = await this.getUpline(vendor.userId, mlmConfig.maxLevels || 9);

    let totalCommissionDistributed = 0;

    for (const node of upline) {
      const levelConfig = mlmConfig.levels.find((l) => l.level === node.level);
      if (levelConfig && levelConfig.percentage > 0) {
        const commissionAmount = Math.round((subscriptionAmount * levelConfig.percentage) / 100);

        if (commissionAmount > 0) {
          // Idempotency check: prevent duplicate commission on the same subscription and level
          const existingCommission = await Commission.findOne({
            subscriptionId,
            level: node.level,
            recipientUserId: node.user._id,
          });

          if (existingCommission) continue;

          // 1. Create Commission record
          await Commission.create({
            subscriptionId,
            level: node.level,
            type: 'MLM_VENDOR_SUBSCRIPTION_COMMISSION',
            recipientUserId: node.user._id,
            vendorId: vendor._id,
            orderAmount: subscriptionAmount,
            commissionPercentage: levelConfig.percentage,
            commissionAmount,
            status: 'PAID',
          });

          totalCommissionDistributed += commissionAmount;

          // 2. Credit beneficiary wallet with immutable double-entry ledger record
          await walletService.creditWallet({
            userId: node.user._id,
            amount: commissionAmount,
            type: 'COMMISSION_CREDIT',
            referenceId: subscriptionId.toString(),
            referenceType: 'VENDOR_SUBSCRIPTION',
            description: `Level ${node.level} MLM Commission from vendor subscription (${vendor.storeName})`,
            metadata: {
              vendorId: vendor._id,
              level: node.level,
              subscriptionId: subscriptionId.toString(),
            },
          });

          // 3. Send Notification
          try {
            await notificationService.createNotification(
              {
                userId: node.user._id,
                title: `Level ${node.level} MLM Commission Received`,
                message: `You earned ₹${commissionAmount.toLocaleString('en-IN')} commission from downline vendor subscription (${vendor.storeName}).`,
                type: 'COMMISSION_EARNED',
                link: '/account/commissions',
              },
              { dedupeKey: `${subscriptionId.toString()}:${node.level}:SUB_COMMISSION` }
            );
          } catch (err) {
            console.error('Failed to send commission notification:', err);
          }
        }
      }
    }

    // 4. Record in PlatformLedger as Vendor Subscription Revenue & Commission Distribution
    try {
      const latestPlatformRecord = await PlatformLedger.findOne().sort({ createdAt: -1 });
      const currentBalance = latestPlatformRecord?.balanceSnapshot || 0;
      const netPlatformRetained = subscriptionAmount - totalCommissionDistributed;
      const nextBalance = currentBalance + netPlatformRetained;

      await PlatformLedger.create({
        transactionId: `PL-SUB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'VENDOR_SUBSCRIPTION',
        sourceEntityType: 'SUBSCRIPTION',
        sourceEntityId: subscriptionId.toString(),
        credit: subscriptionAmount,
        debit: totalCommissionDistributed,
        balanceSnapshot: nextBalance,
        description: `Vendor subscription fee (₹${subscriptionAmount}) with ₹${totalCommissionDistributed} distributed across 9-level MLM`,
        metadata: {
          vendorId: vendor._id,
          subscriptionAmount,
          totalCommissionDistributed,
          uplineLevelsCount: upline.length,
        },
      });
    } catch (ledgerErr) {
      console.error('Failed to log platform subscription ledger:', ledgerErr);
    }
  },

  async getUpline(userId, maxLevels = 9) {
    const user = await User.findById(userId).select('referralPath');
    if (!user || !user.referralPath || user.referralPath.length === 0) {
      return [];
    }

    const uplineIds = [];
    const len = user.referralPath.length;
    for (let i = 1; i <= maxLevels; i++) {
      if (len - i >= 0) {
        uplineIds.push(user.referralPath[len - i]);
      }
    }

    if (uplineIds.length === 0) return [];

    // Fetch all active upline users in a single query (exclude suspended/blocked accounts)
    const uplineUsers = await User.find({
      _id: { $in: uplineIds },
      status: { $nin: ['SUSPENDED', 'BLOCKED'] },
    });

    // Map back in order of level (1 = immediate referrer, 2 = grandparent, etc.)
    const uplineNodes = [];
    for (let i = 0; i < uplineIds.length; i++) {
      const id = uplineIds[i];
      const foundUser = uplineUsers.find((u) => u._id.toString() === id.toString());
      if (foundUser) {
        uplineNodes.push({ level: i + 1, user: foundUser });
      }
    }

    return uplineNodes;
  },

  async buildReferralTree(userId, maxLevel = 9) {
    const user = await User.findById(userId).select('name email referralCode fairCoinBalance createdAt');
    if (!user) return null;

    // Set maximum allowed level cap to 9
    const capLevel = Math.min(9, Math.max(1, maxLevel));

    // Fetch all referrals for this ancestor in a single query
    const referrals = await Referral.find({ userId, level: { $lte: capLevel } })
      .populate('referredUserId', 'name email referralCode createdAt status');

    const tree = {};
    const stats = {
      totalReferrals: 0,
    };

    for (let i = 1; i <= capLevel; i++) {
      tree[`level${i}`] = [];
      stats[`level${i}Count`] = 0;
    }

    for (const ref of referrals) {
      if (ref.referredUserId) {
        const lvl = ref.level;
        if (lvl <= capLevel) {
          tree[`level${lvl}`].push(ref.referredUserId);
          stats[`level${lvl}Count`]++;
          stats.totalReferrals++;
        }
      }
    }

    const rankInfo = this.calculateLeadershipRank(stats.level1Count || 0);
    const leaderboard = await this.getLeaderboard(5);

    return {
      user,
      rankInfo,
      leaderboard,
      stats,
      tree,
    };
  },
};
