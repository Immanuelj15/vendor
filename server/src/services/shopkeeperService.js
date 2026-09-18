import { Shopkeeper } from '../models/Shopkeeper.js';
import { Shop } from '../models/Shop.js';
import { Franchise } from '../models/Franchise.js';
import { Territory } from '../models/Territory.js';
import { User } from '../models/User.js';
import { KYCDocument } from '../models/KYCDocument.js';
import { Subscription } from '../models/Subscription.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';
import { AuditLog } from '../models/AuditLog.js';
import { ShopQRCode } from '../models/ShopQRCode.js';
import { CustomerShopAttribution } from '../models/CustomerShopAttribution.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import { territoryAccessService } from './territoryAccessService.js';
import { kycService } from './kycService.js';
import { subscriptionService } from './subscriptionService.js';
import { shopActivationService } from './shopActivationService.js';
import mongoose from 'mongoose';
import crypto from 'crypto';

export const shopkeeperService = {
  // Shopkeeper onboarding
  async onboardShopkeeper(operatorUser, data) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const talukFranchise = await Franchise.findById(data.talukFranchiseId).populate('territoryId').session(session);
      if (!talukFranchise || talukFranchise.franchiseType !== 'TALUK') {
        throw new ApiError(400, 'Invalid Taluk Franchise ID', ERROR_CODES.BAD_REQUEST);
      }

      // Authorization checks
      if (!['SUPER_ADMIN', 'ADMIN'].includes(operatorUser.role)) {
        if (operatorUser.role !== 'TALUK_FRANCHISE') {
          throw new ApiError(403, 'Only Taluk Franchise operators can onboard shopkeepers', ERROR_CODES.FORBIDDEN);
        }
        // Verify taluk operator owns this franchise
        const operatorFranchise = await territoryAccessService.getUserFranchise(operatorUser._id);
        if (!operatorFranchise || operatorFranchise._id.toString() !== data.talukFranchiseId) {
          throw new ApiError(403, 'Cannot onboard shopkeeper outside your Taluk territory', ERROR_CODES.FORBIDDEN);
        }
      }

      const targetUser = await User.findById(data.userId).session(session);
      if (!targetUser) {
        throw new ApiError(404, 'User not found', ERROR_CODES.NOT_FOUND);
      }

      // Check if user already holds a shopkeeper role
      const existing = await Shopkeeper.findOne({ userId: data.userId }).session(session);
      if (existing) {
        throw new ApiError(400, 'User is already registered as a shopkeeper', ERROR_CODES.BAD_REQUEST);
      }

      const shopkeeper = await Shopkeeper.create(
        [
          {
            ...data,
            status: 'PENDING',
            onboardingStatus: 'PENDING',
            kycStatus: 'PENDING',
          },
        ],
        { session }
      );

      await AuditLog.create(
        [
          {
            userId: operatorUser._id,
            action: 'SHOPKEEPER_ONBOARD_INITIATED',
            entity: 'Shopkeeper',
            entityId: shopkeeper[0]._id.toString(),
            ipAddress: '127.0.0.1',
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return shopkeeper[0];
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  async getShopkeeperById(user, shopkeeperId) {
    const shopkeeper = await Shopkeeper.findById(shopkeeperId).populate('talukFranchiseId userId');
    if (!shopkeeper) {
      throw new ApiError(404, 'Shopkeeper profile not found', ERROR_CODES.NOT_FOUND);
    }

    // Scoped verification
    if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      if (user.role === 'SHOPKEEPER') {
        if (shopkeeper.userId._id.toString() !== user._id.toString()) {
          throw new ApiError(403, 'Cannot access another shopkeeper profile', ERROR_CODES.FORBIDDEN);
        }
      } else {
        const canManage = await territoryAccessService.canManageFranchise(user, shopkeeper.talukFranchiseId);
        if (!canManage) {
          throw new ApiError(403, 'Access denied: Scoped territory mismatch', ERROR_CODES.FORBIDDEN);
        }
      }
    }

    return shopkeeper;
  },

  async listShopkeepers(user, filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.onboardingStatus) query.onboardingStatus = filters.onboardingStatus;

    if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      const userFranchise = await territoryAccessService.getUserFranchise(user._id);
      if (!userFranchise) {
        return [];
      }

      if (userFranchise.franchiseType === 'STATE') {
        const matchingTerritories = await Territory.find({ state: userFranchise.territoryId.state });
        const franchises = await Franchise.find({ territoryId: { $in: matchingTerritories.map(t => t._id) } });
        query.talukFranchiseId = { $in: franchises.map(f => f._id) };
      } else if (userFranchise.franchiseType === 'DISTRICT') {
        const matchingTerritories = await Territory.find({ 
          district: userFranchise.territoryId.district, 
          state: userFranchise.territoryId.state 
        });
        const franchises = await Franchise.find({ territoryId: { $in: matchingTerritories.map(t => t._id) } });
        query.talukFranchiseId = { $in: franchises.map(f => f._id) };
      } else if (userFranchise.franchiseType === 'TALUK') {
        query.talukFranchiseId = userFranchise._id;
      } else {
        return [];
      }
    }

    return await Shopkeeper.find(query).populate('talukFranchiseId userId');
  },

  // KYC submit
  async submitKyc(user, data) {
    return await kycService.submitKyc(user, data);
  },

  async reviewKyc(adminUser, kycId, status, rejectionReason = '') {
    return await kycService.reviewKyc(adminUser, kycId, status, rejectionReason);
  },

  // Subscription plan creation
  async createSubscriptionPlan(adminUser, data) {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(adminUser.role)) {
      throw new ApiError(403, 'Only administrators can create subscription plans', ERROR_CODES.FORBIDDEN);
    }

    const existing = await SubscriptionPlan.findOne({ code: data.code.toUpperCase() });
    if (existing) {
      throw new ApiError(400, 'Subscription plan with this code already exists', ERROR_CODES.BAD_REQUEST);
    }

    return await SubscriptionPlan.create({
      ...data,
      code: data.code.toUpperCase()
    });
  },

  async listSubscriptionPlans() {
    return await SubscriptionPlan.find({ isActive: true });
  },

  // Active Subscription
  async activateSubscription(user, { subscriptionId, planId, entityType, entityId, paymentId }) {
    if (subscriptionId) {
      return await subscriptionService.activateSubscription(subscriptionId, paymentId);
    }
    let sub = await Subscription.findOne({ entityId, planId, status: 'PENDING' });
    if (!sub) {
      const result = await subscriptionService.createSubscription(user._id, { planId, entityType, entityId });
      sub = result.subscription;
    }
    return await subscriptionService.activateSubscription(sub._id, paymentId);
  },

  async renewSubscription(user, subscriptionId, paymentId) {
    if (paymentId) {
      return await subscriptionService.activateSubscription(subscriptionId, paymentId);
    }
    return await subscriptionService.renewSubscription(user._id, subscriptionId);
  },

  // Shop creation and management
  async createShop(operatorUser, data) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const shopkeeper = await Shopkeeper.findById(data.shopkeeperId).session(session);
      if (!shopkeeper) {
        throw new ApiError(404, 'Shopkeeper profile not found', ERROR_CODES.NOT_FOUND);
      }

      if (shopkeeper.onboardingStatus !== 'SUBSCRIBED') {
        throw new ApiError(400, 'Shopkeeper onboarding is incomplete. KYC and subscription are required.', ERROR_CODES.BAD_REQUEST);
      }

      const talukFranchise = await Franchise.findById(data.talukFranchiseId).populate('territoryId').session(session);
      if (!talukFranchise || talukFranchise._id.toString() !== shopkeeper.talukFranchiseId.toString()) {
        throw new ApiError(400, 'Taluk Franchise mismatch', ERROR_CODES.BAD_REQUEST);
      }

      // Check authorisations
      if (!['SUPER_ADMIN', 'ADMIN'].includes(operatorUser.role)) {
        if (operatorUser.role !== 'TALUK_FRANCHISE') {
          throw new ApiError(403, 'Only Taluk Franchise operators can approve shop creation', ERROR_CODES.FORBIDDEN);
        }
        const operatorFranchise = await territoryAccessService.getUserFranchise(operatorUser._id);
        if (!operatorFranchise || operatorFranchise._id.toString() !== data.talukFranchiseId) {
          throw new ApiError(403, 'Cannot create shop outside your Taluk territory', ERROR_CODES.FORBIDDEN);
        }
      }

      // Auto-generate code
      const shopCode = await this.generateShopCode(data.state, data.district);
      const slug = this.generateSlug(data.shopName);
      const qrPublicToken = crypto.randomBytes(16).toString('hex');

      const shop = await Shop.create(
        [
          {
            ...data,
            shopCode,
            slug,
            qrPublicToken,
            status: 'PENDING',
            kycStatus: 'APPROVED', // inherited from verified shopkeeper KYC
            subscriptionId: shopkeeper.subscriptionId
          },
        ],
        { session }
      );

      // Mark shopkeeper as fully APPROVED
      shopkeeper.status = 'ACTIVE';
      shopkeeper.onboardingStatus = 'APPROVED';
      await shopkeeper.save({ session });

      // Promote the user role to SHOPKEEPER in database
      await User.findByIdAndUpdate(shopkeeper.userId, { role: 'SHOPKEEPER' }).session(session);

      await AuditLog.create(
        [
          {
            userId: operatorUser._id,
            action: 'SHOP_CREATED',
            entity: 'Shop',
            entityId: shop[0]._id.toString(),
            ipAddress: '127.0.0.1',
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return shop[0];
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  async getShopById(user, shopId) {
    const shop = await Shop.findById(shopId).populate('shopkeeperId talukFranchiseId');
    if (!shop) {
      throw new ApiError(404, 'Shop not found', ERROR_CODES.NOT_FOUND);
    }

    const canAccess = await territoryAccessService.canAccessShop(user, shop);
    if (!canAccess) {
      throw new ApiError(403, 'Access denied: Scoped territory mismatch', ERROR_CODES.FORBIDDEN);
    }

    return shop;
  },

  async listShops(user, filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.pincode) query.pincode = filters.pincode;

    if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      if (user.role === 'SHOPKEEPER') {
        const sk = await Shopkeeper.findOne({ userId: user._id });
        if (!sk) return [];
        query.shopkeeperId = sk._id;
      } else {
        const userFranchise = await territoryAccessService.getUserFranchise(user._id);
        if (!userFranchise) return [];

        if (userFranchise.franchiseType === 'STATE') {
          query.state = userFranchise.territoryId.state;
        } else if (userFranchise.franchiseType === 'DISTRICT') {
          query.district = userFranchise.territoryId.district;
          query.state = userFranchise.territoryId.state;
        } else if (userFranchise.franchiseType === 'TALUK') {
          query.taluk = userFranchise.territoryId.taluk;
          query.district = userFranchise.territoryId.district;
          query.state = userFranchise.territoryId.state;
        }
      }
    }

    return await Shop.find(query).populate('shopkeeperId talukFranchiseId');
  },

  async updateShopStatus(operatorUser, shopId, status) {
    const shop = await Shop.findById(shopId);
    if (!shop) {
      throw new ApiError(404, 'Shop not found', ERROR_CODES.NOT_FOUND);
    }

    const canManage = await territoryAccessService.canAccessShop(operatorUser, shop);
    if (!canManage) {
      throw new ApiError(403, 'Not authorized to manage this shop status', ERROR_CODES.FORBIDDEN);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (status === 'ACTIVE') {
        const sk = await Shopkeeper.findById(shop.shopkeeperId).session(session);
        const franchise = await Franchise.findById(shop.talukFranchiseId).session(session);
        
        const isFranchiseActive = franchise && franchise.status === 'ACTIVE';
        const isShopkeeperActive = sk && ['ACTIVE', 'APPROVED'].includes(sk.status);
        const isKycVerified = sk && sk.kycStatus === 'APPROVED';
        
        const activeSub = await Subscription.findOne({
          $or: [
            { entityType: 'SHOPKEEPER', entityId: shop.shopkeeperId },
            { entityType: 'SHOP', entityId: shop._id }
          ],
          status: 'ACTIVE',
          endDate: { $gt: new Date() }
        }).session(session);
        
        const isSubscriptionActive = !!activeSub;
        
        if (!isFranchiseActive || !isShopkeeperActive || !isKycVerified || !isSubscriptionActive) {
          throw new ApiError(400, 'Cannot activate shop: KYC, active subscription, active shopkeeper, and active franchise are required.', ERROR_CODES.BAD_REQUEST);
        }

        shop.status = 'ACTIVE';
        shop.activatedAt = new Date();
        await shop.save({ session });

        if (sk) {
          sk.status = 'ACTIVE';
          await sk.save({ session });
          await User.findByIdAndUpdate(sk.userId, { role: 'SHOPKEEPER' }).session(session);
        }
      } else {
        shop.status = status;
        await shop.save({ session });

        if (['INACTIVE', 'SUSPENDED', 'EXPIRED'].includes(status)) {
          const sk = await Shopkeeper.findById(shop.shopkeeperId).session(session);
          if (sk) {
            // Check if shopkeeper has other active shops
            const otherActiveShops = await Shop.findOne({
              shopkeeperId: sk._id,
              status: 'ACTIVE',
              _id: { $ne: shop._id }
            }).session(session);

            if (!otherActiveShops) {
              sk.status = 'INACTIVE';
              await sk.save({ session });
              await User.findByIdAndUpdate(sk.userId, { role: 'USER' }).session(session);
            }
          }
        }
      }

      // Notify Shopkeeper
      const skObj = sk || await Shopkeeper.findById(shop.shopkeeperId).session(session);
      if (skObj) {
        let type = 'SHOP';
        let title = 'Shop Status Update';
        let message = `Your shop "${shop.shopName}" status has been updated to ${status}.`;

        if (status === 'ACTIVE') {
          type = 'SHOP_ACTIVATED';
          title = 'Shop Activated';
          message = `Your shop "${shop.shopName}" has been successfully activated and is now operational!`;
        } else if (status === 'SUSPENDED') {
          type = 'SHOP_SUSPENDED';
          title = 'Shop Suspended';
          message = `Your shop "${shop.shopName}" has been suspended. Please contact support.`;
        } else if (status === 'APPROVED') {
          type = 'SHOP';
          title = 'Shop Approved';
          message = `Your shop "${shop.shopName}" has been approved!`;
        }

        try {
          await notificationService.createNotification({
            userId: skObj.userId,
            title,
            message,
            type,
            link: '/shopkeeper/dashboard'
          }, { session, dedupeKey: `${shop._id.toString()}:${type}:${status}` });
        } catch (err) {
          console.error('Failed to notify shop status update:', err);
        }
      }

      await AuditLog.create(
        [
          {
            userId: operatorUser._id,
            action: 'SHOP_STATUS_CHANGED',
            entity: 'Shop',
            entityId: shopId,
            ipAddress: '127.0.0.1',
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return shop;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  // Helpers
  async generateShopCode(state, district) {
    const stCode = (state.substring(0, 2)).toUpperCase();
    const disCode = (district.substring(0, 3)).toUpperCase();

    const count = await Shop.countDocuments({
      state: new RegExp(`^${state}$`, 'i'),
      district: new RegExp(`^${district}$`, 'i')
    });

    let seq = count + 1;
    let shopCode = `BSM-${stCode}-${disCode}-${seq.toString().padStart(6, '0')}`;

    let isCollision = await Shop.findOne({ shopCode });
    while (isCollision) {
      seq += 1;
      shopCode = `BSM-${stCode}-${disCode}-${seq.toString().padStart(6, '0')}`;
      isCollision = await Shop.findOne({ shopCode });
    }

    return shopCode;
  },

  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
  },

  // QR Code Generation
  async generateShopQR(operatorUser, shopId, regenerate = false) {
    const shop = await Shop.findById(shopId);
    if (!shop) {
      throw new ApiError(404, 'Shop not found', ERROR_CODES.NOT_FOUND);
    }

    const canManage = await territoryAccessService.canAccessShop(operatorUser, shop);
    if (!canManage) {
      throw new ApiError(403, 'Not authorized to manage this shop QR code', ERROR_CODES.FORBIDDEN);
    }

    // Check if an active QR exists
    const activeQR = await ShopQRCode.findOne({ shopId, status: 'ACTIVE' });
    if (activeQR && !regenerate) {
      return activeQR;
    }

    const session = await mongoose.startSession();
    // standalone local Mongo fallback for transactions
    let useTransaction = true;
    try {
      session.startTransaction();
    } catch (e) {
      useTransaction = false;
    }

    try {
      if (activeQR) {
        activeQR.status = 'REVOKED';
        activeQR.revokedAt = new Date();
        await activeQR.save({ session: useTransaction ? session : undefined });
      }

      const publicToken = crypto.randomBytes(24).toString('hex');
      const code = `QR-${shop.shopCode}-${Math.floor(1000 + Math.random() * 9000)}`;

      const qrDocs = await ShopQRCode.create(
        [
          {
            shopId,
            publicToken,
            code,
            status: 'ACTIVE',
            createdBy: operatorUser._id,
          },
        ],
        { session: useTransaction ? session : undefined }
      );

      shop.qrPublicToken = publicToken;
      await shop.save({ session: useTransaction ? session : undefined });

      const skObj = await Shopkeeper.findById(shop.shopkeeperId).session(useTransaction ? session : undefined);
      if (skObj) {
        try {
          await notificationService.createNotification({
            userId: skObj.userId,
            title: 'Shop QR Code Activated',
            message: `A new QR code has been generated and activated for your shop "${shop.shopName}".`,
            type: 'SHOP',
            link: '/shopkeeper/qr'
          }, { session: useTransaction ? session : undefined, dedupeKey: `${publicToken}:QR_ACTIVATED` });
        } catch (err) {
          console.error('Failed to notify QR activation:', err);
        }
      }

      if (useTransaction) {
        await session.commitTransaction();
      }
      return qrDocs[0];
    } catch (err) {
      if (useTransaction) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      session.endSession();
    }
  },

  // QR Code Revocation
  async revokeShopQR(operatorUser, shopId) {
    const shop = await Shop.findById(shopId);
    if (!shop) {
      throw new ApiError(404, 'Shop not found', ERROR_CODES.NOT_FOUND);
    }

    const canManage = await territoryAccessService.canAccessShop(operatorUser, shop);
    if (!canManage) {
      throw new ApiError(403, 'Not authorized to manage this shop QR code', ERROR_CODES.FORBIDDEN);
    }

    const activeQR = await ShopQRCode.findOne({ shopId, status: 'ACTIVE' });
    if (!activeQR) {
      return { message: 'No active QR code to revoke' };
    }

    activeQR.status = 'REVOKED';
    activeQR.revokedAt = new Date();
    await activeQR.save();

    shop.qrPublicToken = null;
    await shop.save();

    const skObj = await Shopkeeper.findById(shop.shopkeeperId);
    if (skObj) {
      try {
        await notificationService.createNotification({
          userId: skObj.userId,
          title: 'Shop QR Code Deactivated',
          message: `The QR code for your shop "${shop.shopName}" has been deactivated.`,
          type: 'SHOP',
          link: '/shopkeeper/qr'
        }, { dedupeKey: `${activeQR._id.toString()}:QR_DEACTIVATED` });
      } catch (err) {
        console.error('Failed to notify QR deactivation:', err);
      }
    }

    return activeQR;
  },

  // Reactivate QR code if appropriate (Admin functionality)
  async reactivateShopQR(operatorUser, qrCodeId) {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(operatorUser.role)) {
      throw new ApiError(403, 'Only administrators can reactivate QR codes', ERROR_CODES.FORBIDDEN);
    }

    const qr = await ShopQRCode.findById(qrCodeId);
    if (!qr) {
      throw new ApiError(404, 'QR code not found', ERROR_CODES.NOT_FOUND);
    }

    // Revoke any current active QR for this shop first
    await ShopQRCode.updateMany({ shopId: qr.shopId, status: 'ACTIVE' }, { status: 'REVOKED', revokedAt: new Date() });

    qr.status = 'ACTIVE';
    qr.revokedAt = null;
    await qr.save();

    await Shop.findByIdAndUpdate(qr.shopId, { qrPublicToken: qr.publicToken });

    const shop = await Shop.findById(qr.shopId);
    if (shop) {
      const skObj = await Shopkeeper.findById(shop.shopkeeperId);
      if (skObj) {
        try {
          await notificationService.createNotification({
            userId: skObj.userId,
            title: 'Shop QR Code Activated',
            message: `The QR code for your shop "${shop.shopName}" has been reactivated.`,
            type: 'SHOP',
            link: '/shopkeeper/qr'
          }, { dedupeKey: `${qr._id.toString()}:QR_REACTIVATED` });
        } catch (err) {
          console.error('Failed to notify QR reactivation:', err);
        }
      }
    }

    return qr;
  },

  // QR Code Resolution (Public)
  async resolveShopQR(publicToken) {
    const qr = await ShopQRCode.findOne({ publicToken });
    if (!qr) {
      throw new ApiError(404, 'QR code not found', ERROR_CODES.NOT_FOUND);
    }

    if (qr.status !== 'ACTIVE') {
      throw new ApiError(400, 'This QR code has been revoked', ERROR_CODES.BAD_REQUEST);
    }

    const shop = await Shop.findById(qr.shopId);
    if (!shop) {
      throw new ApiError(404, 'Associated shop not found', ERROR_CODES.NOT_FOUND);
    }

    if (shop.status !== 'ACTIVE') {
      throw new ApiError(400, 'The associated shop is currently inactive or suspended', ERROR_CODES.BAD_REQUEST);
    }

    return {
      shopName: shop.shopName,
      shopCode: shop.shopCode,
      slug: shop.slug,
      state: shop.state,
      district: shop.district,
      taluk: shop.taluk,
      pincode: shop.pincode,
      phone: shop.phone,
      email: shop.email,
      status: shop.status,
      qrStatus: qr.status,
      qrCodeId: qr._id,
      shopId: shop._id,
    };
  },

  // Customer Shop Attribution
  async attributeCustomerQR(customerId, publicToken) {
    const qr = await ShopQRCode.findOne({ publicToken });
    if (!qr) {
      throw new ApiError(404, 'QR code not found', ERROR_CODES.NOT_FOUND);
    }

    if (qr.status !== 'ACTIVE') {
      throw new ApiError(400, 'This QR code has been revoked', ERROR_CODES.BAD_REQUEST);
    }

    const shop = await Shop.findById(qr.shopId);
    if (!shop) {
      throw new ApiError(404, 'Associated shop not found', ERROR_CODES.NOT_FOUND);
    }

    if (shop.status !== 'ACTIVE') {
      throw new ApiError(400, 'The associated shop is currently inactive or suspended', ERROR_CODES.BAD_REQUEST);
    }

    // Check existing attribution
    const existing = await CustomerShopAttribution.findOne({ customerUserId: customerId });
    if (existing) {
      if (existing.shopId.toString() === shop._id.toString()) {
        return {
          attributed: true,
          alreadyAttributed: true,
          shopId: shop._id,
        };
      } else {
        return {
          attributed: false,
          reason: 'CUSTOMER_ALREADY_ATTRIBUTED',
        };
      }
    }

    const session = await mongoose.startSession();
    // Standalone local Mongo fallback for transactions
    let useTransaction = true;
    try {
      session.startTransaction();
    } catch (e) {
      useTransaction = false;
    }

    try {
      await CustomerShopAttribution.create(
        [
          {
            customerUserId: customerId,
            shopId: shop._id,
            qrCodeId: qr._id,
            attributedVia: 'QR_CODE',
            status: 'ACTIVE',
          },
        ],
        { session: useTransaction ? session : undefined }
      );

      await User.findByIdAndUpdate(
        customerId,
        { attributedShopId: shop._id },
        { session: useTransaction ? session : undefined }
      );

      if (useTransaction) {
        await session.commitTransaction();
      }
      return {
        attributed: true,
        shopId: shop._id,
      };
    } catch (err) {
      if (useTransaction) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      session.endSession();
    }
  }
};
