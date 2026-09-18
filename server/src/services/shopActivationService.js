import { Shop } from '../models/Shop.js';
import { Shopkeeper } from '../models/Shopkeeper.js';
import { Franchise } from '../models/Franchise.js';
import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { notificationService } from './notificationService.js';
import mongoose from 'mongoose';

export const shopActivationService = {
  async activateShop(shopId, options = {}) {
    const session = options.session || null;

    const shop = await Shop.findById(shopId).session(session);
    if (!shop) return null;

    const shopkeeper = await Shopkeeper.findById(shop.shopkeeperId).session(session);
    if (!shopkeeper) return null;

    const franchise = await Franchise.findById(shop.talukFranchiseId).session(session);
    if (!franchise) return null;

    // 1. Check prerequisites
    const isFranchiseActive = franchise.status === 'ACTIVE';
    const isShopkeeperActive = ['ACTIVE', 'APPROVED'].includes(shopkeeper.status);
    const isKycVerified = shopkeeper.kycStatus === 'APPROVED';

    // Check if there is an active subscription for shop or shopkeeper
    const activeSub = await Subscription.findOne({
      $or: [
        { entityType: 'SHOPKEEPER', entityId: shopkeeper._id },
        { entityType: 'SHOP', entityId: shop._id }
      ],
      status: 'ACTIVE',
      endDate: { $gt: new Date() }
    }).session(session);

    const isSubscriptionActive = !!activeSub;

    const allPrerequisitesMet = isFranchiseActive && isShopkeeperActive && isKycVerified && isSubscriptionActive;

    const oldStatus = shop.status;

    if (allPrerequisitesMet) {
      if (oldStatus !== 'ACTIVE') {
        shop.status = 'ACTIVE';
        shop.activatedAt = new Date();
        await shop.save({ session });

        // Sync shopkeeper status and role
        shopkeeper.status = 'ACTIVE';
        await shopkeeper.save({ session });
        await User.findByIdAndUpdate(shopkeeper.userId, { role: 'SHOPKEEPER' }).session(session);

        // Audit Log
        await AuditLog.create(
          [
            {
              userId: shopkeeper.userId,
              action: 'SHOP_ACTIVATED',
              entity: 'Shop',
              entityId: shop._id.toString(),
              oldValue: { status: oldStatus },
              newValue: { status: 'ACTIVE' },
              ipAddress: '127.0.0.1',
            },
          ],
          { session }
        );

        // Notify
        await notificationService.createNotification({
          userId: shopkeeper.userId,
          title: 'Shop Activated',
          message: `Your shop "${shop.shopName}" has been successfully activated and is now operational!`,
          type: 'SHOP',
        }, { session });
      }
    } else {
      // Prerequisites failed, shop must be INACTIVE
      if (oldStatus === 'ACTIVE') {
        let failureReason = 'INACTIVE';
        if (!isSubscriptionActive) failureReason = 'EXPIRED';

        shop.status = failureReason === 'EXPIRED' ? 'EXPIRED' : 'INACTIVE';
        await shop.save({ session });

        // Check if shopkeeper has other active shops before demoting role
        const otherActiveShops = await Shop.findOne({
          shopkeeperId: shopkeeper._id,
          status: 'ACTIVE',
          _id: { $ne: shop._id }
        }).session(session);

        if (!otherActiveShops) {
          shopkeeper.status = 'INACTIVE';
          await shopkeeper.save({ session });
          await User.findByIdAndUpdate(shopkeeper.userId, { role: 'USER' }).session(session);
        }

        // Audit Log
        await AuditLog.create(
          [
            {
              userId: shopkeeper.userId,
              action: 'SHOP_DEACTIVATED',
              entity: 'Shop',
              entityId: shop._id.toString(),
              oldValue: { status: oldStatus },
              newValue: { status: shop.status },
              ipAddress: '127.0.0.1',
            },
          ],
          { session }
        );

        // Notify
        await notificationService.createNotification({
          userId: shopkeeper.userId,
          title: 'Shop Inactive',
          message: `Your shop "${shop.shopName}" has been deactivated because subscription or KYC requirements are no longer satisfied.`,
          type: 'SHOP',
        }, { session });
      }
    }

    return shop;
  }
};
