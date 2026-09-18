import { Subscription } from '../models/Subscription.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';
import { Payment } from '../models/Payment.js';
import { Shopkeeper } from '../models/Shopkeeper.js';
import { Franchise } from '../models/Franchise.js';
import { Shop } from '../models/Shop.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { paymentService } from './paymentService.js';
import { notificationService } from './notificationService.js';
import { shopActivationService } from './shopActivationService.js';
import { territoryAccessService } from './territoryAccessService.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import mongoose from 'mongoose';

export const subscriptionService = {
  async createSubscription(userId, { planId, entityType, entityId }) {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
      throw new ApiError(404, 'Subscription plan not found or inactive', ERROR_CODES.NOT_FOUND);
    }

    if (plan.applicableEntityType !== entityType) {
      throw new ApiError(400, 'Subscription plan not applicable to this entity type', ERROR_CODES.BAD_REQUEST);
    }

    // 1. Validate KYC requirements
    if (entityType === 'SHOPKEEPER') {
      const shopkeeper = await Shopkeeper.findById(entityId);
      if (!shopkeeper || shopkeeper.userId.toString() !== userId.toString()) {
        throw new ApiError(403, 'Unauthorized access to shopkeeper profile', ERROR_CODES.FORBIDDEN);
      }
      if (shopkeeper.kycStatus !== 'APPROVED') {
        throw new ApiError(400, 'KYC approval is required before purchasing a subscription', ERROR_CODES.BAD_REQUEST);
      }
    } else if (entityType === 'FRANCHISE') {
      const franchise = await Franchise.findById(entityId);
      if (!franchise || franchise.userId.toString() !== userId.toString()) {
        throw new ApiError(403, 'Unauthorized access to franchise profile', ERROR_CODES.FORBIDDEN);
      }
      if (franchise.kycStatus !== 'APPROVED') {
        throw new ApiError(400, 'KYC approval is required before purchasing a subscription', ERROR_CODES.BAD_REQUEST);
      }
    } else if (entityType === 'SHOP') {
      const shop = await Shop.findById(entityId).populate('shopkeeperId');
      if (!shop || shop.shopkeeperId.userId.toString() !== userId.toString()) {
        throw new ApiError(403, 'Unauthorized access to shop profile', ERROR_CODES.FORBIDDEN);
      }
      if (shop.kycStatus !== 'APPROVED') {
        throw new ApiError(400, 'KYC approval is required before purchasing a subscription', ERROR_CODES.BAD_REQUEST);
      }
    }

    // 2. Prevent multiple active subscriptions
    const existingActive = await Subscription.findOne({ entityId, status: 'ACTIVE' });
    if (existingActive) {
      throw new ApiError(400, 'An active subscription already exists for this entity', ERROR_CODES.BAD_REQUEST);
    }

    // 3. Create subscription in PENDING state
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.durationDays);

    const subscription = await Subscription.create({
      ownerUserId: userId,
      entityType,
      entityId,
      planId,
      startDate,
      endDate,
      status: 'PENDING',
      renewalCount: 0,
    });

    // Notify creation
    try {
      await notificationService.createNotification({
        userId,
        title: 'Subscription Created',
        message: `Your subscription has been created and is pending payment.`,
        type: 'SUBSCRIPTION_CREATED',
      }, { dedupeKey: `${subscription._id.toString()}:SUBSCRIPTION_CREATED` });
    } catch (err) {
      console.error('Failed to send subscription created notification:', err);
    }

    // 4. Create payment order via PaymentService
    const paymentPayload = await paymentService.createPaymentOrder({
      subscriptionId: subscription._id,
      userId,
    });

    return {
      subscription,
      paymentPayload,
    };
  },

  async activateSubscription(subscriptionId, paymentId) {
    const session = await mongoose.startSession();
    let useTransaction = true;
    try {
      session.startTransaction();
    } catch (e) {
      useTransaction = false;
    }

    try {
      const subscription = await Subscription.findById(subscriptionId).populate('planId').session(useTransaction ? session : undefined);
      if (!subscription) {
        throw new ApiError(404, 'Subscription not found', ERROR_CODES.NOT_FOUND);
      }

      const payment = await Payment.findById(paymentId).session(useTransaction ? session : undefined);
      if (!payment) {
        throw new ApiError(404, 'Payment record not found', ERROR_CODES.NOT_FOUND);
      }

      // 1. Payment must be verified
      if (payment.status !== 'CAPTURED' && payment.status !== 'SUCCESS') {
        throw new ApiError(400, 'Associated payment must be verified first', ERROR_CODES.BAD_REQUEST);
      }

      // 2. Payment must belong to this subscription
      if (payment.subscriptionId.toString() !== subscription._id.toString()) {
        throw new ApiError(400, 'Payment record does not match this subscription', ERROR_CODES.BAD_REQUEST);
      }

      // 3. Check expected amount
      if (payment.amount !== subscription.planId.price) {
        throw new ApiError(400, `Payment amount ₹${payment.amount} does not match plan price ₹${subscription.planId.price}`, ERROR_CODES.BAD_REQUEST);
      }

      const isAlreadyActive = subscription.status === 'ACTIVE';
      const isRenewal = isAlreadyActive || subscription.status === 'EXPIRED' || subscription.renewalCount > 0;

      // 4. Calculate subscription dates (UTC)
      const now = new Date();
      let startDate = now;

      if (isRenewal && isAlreadyActive && subscription.endDate > now) {
        // Active extension: renew from existing endDate
        startDate = new Date(subscription.endDate);
      }

      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + subscription.planId.durationDays);

      // 5. Update Subscription state
      subscription.startDate = startDate;
      subscription.endDate = endDate;
      subscription.status = 'ACTIVE';
      subscription.paymentId = payment._id;
      subscription.lastPaymentAt = now;
      if (isRenewal) {
        subscription.renewalCount += 1;
      }
      await subscription.save({ session: useTransaction ? session : undefined });

      // 6. Update target entity reference and end date
      const entityId = subscription.entityId;
      const entityType = subscription.entityType;

      if (entityType === 'SHOPKEEPER') {
        await Shopkeeper.findByIdAndUpdate(
          entityId,
          { subscriptionId: subscription._id, onboardingStatus: 'SUBSCRIBED', renewalDate: endDate, status: 'ACTIVE' },
          { session: useTransaction ? session : undefined }
        );
        const sk = await Shopkeeper.findById(entityId).session(useTransaction ? session : undefined);
        if (sk) {
          await User.findByIdAndUpdate(sk.userId, { role: 'SHOPKEEPER' }).session(useTransaction ? session : undefined);
        }
      } else if (entityType === 'FRANCHISE') {
        await Franchise.findByIdAndUpdate(
          entityId,
          { subscriptionId: subscription._id, expiryDate: endDate },
          { session: useTransaction ? session : undefined }
        );
      } else if (entityType === 'SHOP') {
        await Shop.findByIdAndUpdate(
          entityId,
          { subscriptionId: subscription._id, renewalDate: endDate },
          { session: useTransaction ? session : undefined }
        );
      }

      // 7. Audit Log
      await AuditLog.create(
        [
          {
            userId: subscription.ownerUserId,
            action: isRenewal ? 'SUBSCRIPTION_RENEWED' : 'SUBSCRIPTION_ACTIVATED',
            entity: 'Subscription',
            entityId: subscription._id.toString(),
            newValue: { status: 'ACTIVE', startDate, endDate, paymentId },
            ipAddress: '127.0.0.1',
          },
        ],
        { session: useTransaction ? session : undefined }
      );

      // 8. Notifications
      const notifType = 'SUBSCRIPTION_ACTIVATED';
      await notificationService.createNotification({
        userId: subscription.ownerUserId,
        title: isRenewal ? 'Subscription Renewed' : 'Subscription Activated',
        message: isRenewal 
          ? `Your subscription renewal was successful. New expiry date: ${endDate.toLocaleDateString()}.`
          : `Your subscription is now active! Expiring on: ${endDate.toLocaleDateString()}.`,
        type: notifType,
      }, { 
        session: useTransaction ? session : undefined,
        dedupeKey: `${subscription._id.toString()}:${isRenewal ? 'RENEWAL_SUCCESS' : 'ACTIVATION_SUCCESS'}`
      });

      try {
        const { emailService } = await import('./emailService.js');
        await emailService.sendSubscriptionStatus(subscription, 'ACTIVATED', { isRenewal });
      } catch (err) {
        console.error('Subscription activated email failed:', err);
      }

      // 9. Auto-trigger shop activation if it's a Shopkeeper or Shop subscription
      if (entityType === 'SHOPKEEPER') {
        // Find all shops belonging to this shopkeeper
        const shops = await Shop.find({ shopkeeperId: entityId }).session(useTransaction ? session : undefined);
        for (const shop of shops) {
          await shopActivationService.activateShop(shop._id, { session: useTransaction ? session : undefined });
        }
      } else if (entityType === 'SHOP') {
        await shopActivationService.activateShop(entityId, { session: useTransaction ? session : undefined });
      }

      if (useTransaction) {
        await session.commitTransaction();
      }
      return subscription;
    } catch (err) {
      if (useTransaction) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      session.endSession();
    }
  },

  async renewSubscription(userId, subscriptionId) {
    const subscription = await Subscription.findById(subscriptionId).populate('planId');
    if (!subscription) {
      throw new ApiError(404, 'Subscription record not found', ERROR_CODES.NOT_FOUND);
    }

    if (subscription.ownerUserId.toString() !== userId.toString()) {
      throw new ApiError(403, 'Unauthorized access to subscription profile', ERROR_CODES.FORBIDDEN);
    }

    // Sync expiry status first
    await this.syncStatus(subscriptionId);

    // Create payment order via PaymentService
    const paymentPayload = await paymentService.createPaymentOrder({
      subscriptionId: subscription._id,
      userId,
    });

    return {
      subscription,
      paymentPayload,
    };
  },

  async syncStatus(subscriptionId) {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription || subscription.status !== 'ACTIVE') return;

    const now = new Date();

    // Expiring notification check (5 days window)
    const timeRemaining = subscription.endDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
    if (daysRemaining > 0 && daysRemaining <= 5) {
      const dedupeKey = `${subscription._id.toString()}:EXPIRING_${daysRemaining}`;
      try {
        await notificationService.createNotification({
          userId: subscription.ownerUserId,
          title: 'Subscription Expiring Soon',
          message: `Your subscription will expire in ${daysRemaining} days (Expiry: ${subscription.endDate.toLocaleDateString()}). Please renew soon.`,
          type: 'SUBSCRIPTION_EXPIRING',
        }, { dedupeKey });

        const { emailService } = await import('./emailService.js');
        await emailService.sendSubscriptionStatus(subscription, 'EXPIRING', { daysRemaining });
      } catch (err) {
        console.error('Failed to send expiring notification/email:', err);
      }
    }

    if (now > subscription.endDate) {
      const session = await mongoose.startSession();
      let useTransaction = true;
      try {
        session.startTransaction();
      } catch (e) {
        useTransaction = false;
      }

      try {
        subscription.status = 'EXPIRED';
        await subscription.save({ session: useTransaction ? session : undefined });

        // Update target entity references if needed
        const entityId = subscription.entityId;
        const entityType = subscription.entityType;

        if (entityType === 'SHOPKEEPER') {
          // If shopkeeper subscription expires, deactivate shopkeeper role and active shops
          const shops = await Shop.find({ shopkeeperId: entityId }).session(useTransaction ? session : undefined);
          for (const shop of shops) {
            await shopActivationService.activateShop(shop._id, { session: useTransaction ? session : undefined });
          }
        } else if (entityType === 'SHOP') {
          await shopActivationService.activateShop(entityId, { session: useTransaction ? session : undefined });
        }

        // Audit Log
        await AuditLog.create(
          [
            {
              userId: subscription.ownerUserId,
              action: 'SUBSCRIPTION_EXPIRED',
              entity: 'Subscription',
              entityId: subscription._id.toString(),
              newValue: { status: 'EXPIRED' },
              ipAddress: '127.0.0.1',
            },
          ],
          { session: useTransaction ? session : undefined }
        );

        // Notify
        await notificationService.createNotification({
          userId: subscription.ownerUserId,
          title: 'Subscription Expired',
          message: `Your subscription has expired. Please renew to keep your operations active.`,
          type: 'SUBSCRIPTION_EXPIRED',
        }, { 
          session: useTransaction ? session : undefined,
          dedupeKey: `${subscription._id.toString()}:EXPIRED`
        });

        try {
          const { emailService } = await import('./emailService.js');
          await emailService.sendSubscriptionStatus(subscription, 'EXPIRED');
        } catch (err) {
          console.error('Subscription expired email failed:', err);
        }

        if (useTransaction) {
          await session.commitTransaction();
        }
      } catch (err) {
        if (useTransaction) {
          await session.abortTransaction();
        }
        throw err;
      } finally {
        session.endSession();
      }
    }
  },

  async getMySubscriptions(userId) {
    const list = await Subscription.find({ ownerUserId: userId }).populate('planId').sort({ createdAt: -1 });
    // Sync status on retrieval
    for (const sub of list) {
      await this.syncStatus(sub._id);
    }
    return await Subscription.find({ ownerUserId: userId }).populate('planId').sort({ createdAt: -1 });
  },

  async listSubscriptions(user, filters = {}) {
    if (!['SUPER_ADMIN', 'ADMIN', 'STATE_FRANCHISE', 'DISTRICT_FRANCHISE', 'TALUK_FRANCHISE'].includes(user.role)) {
      throw new ApiError(403, 'Unauthorized access to subscription list', ERROR_CODES.FORBIDDEN);
    }

    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.entityType) query.entityType = filters.entityType;
    if (filters.planId) query.planId = filters.planId;

    const list = await Subscription.find(query)
      .populate('ownerUserId', 'name email')
      .populate('planId')
      .sort({ createdAt: -1 });

    for (const sub of list) {
      await this.syncStatus(sub._id);
    }

    const updatedList = await Subscription.find(query)
      .populate('ownerUserId', 'name email')
      .populate('planId')
      .sort({ createdAt: -1 });

    if (['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      return updatedList;
    }

    const userFranchise = await Franchise.findOne({ userId: user._id, status: 'ACTIVE' }).populate('territoryId');
    if (!userFranchise) {
      return [];
    }

    const filteredList = [];
    for (const sub of updatedList) {
      let subAccess = false;
      try {
        if (sub.entityType === 'SHOP') {
          const shop = await Shop.findById(sub.entityId);
          if (shop) subAccess = await territoryAccessService.canAccessShop(user, shop);
        } else if (sub.entityType === 'SHOPKEEPER') {
          const shopkeeper = await Shopkeeper.findById(sub.entityId);
          if (shopkeeper) {
            const talukFranchise = await Franchise.findById(shopkeeper.talukFranchiseId);
            if (talukFranchise) subAccess = await territoryAccessService.canManageFranchise(user, talukFranchise);
          }
        } else if (sub.entityType === 'FRANCHISE') {
          const targetFranchise = await Franchise.findById(sub.entityId);
          if (targetFranchise) subAccess = await territoryAccessService.canManageFranchise(user, targetFranchise);
        }
      } catch (err) {
        subAccess = false;
      }
      if (subAccess) {
        filteredList.push(sub);
      }
    }

    return filteredList;
  }
};
