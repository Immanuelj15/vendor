import { KYCDocument } from '../models/KYCDocument.js';
import { Franchise } from '../models/Franchise.js';
import { Shopkeeper } from '../models/Shopkeeper.js';
import { Shop } from '../models/Shop.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { notificationService } from './notificationService.js';
import { territoryAccessService } from './territoryAccessService.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import mongoose from 'mongoose';

export const kycService = {
  async submitKyc(user, data) {
    const { entityType, entityId, documentType, documentNumber, documentUrl } = data;

    // 1. Verify entity ownership
    if (entityType === 'FRANCHISE') {
      const franchise = await Franchise.findById(entityId);
      if (!franchise || franchise.userId.toString() !== user._id.toString()) {
        throw new ApiError(403, 'You do not own this franchise profile', ERROR_CODES.FORBIDDEN);
      }
      if (franchise.kycStatus === 'APPROVED') {
        throw new ApiError(400, 'KYC is already approved for this franchise', ERROR_CODES.BAD_REQUEST);
      }
    } else if (entityType === 'SHOPKEEPER') {
      const shopkeeper = await Shopkeeper.findById(entityId);
      if (!shopkeeper || shopkeeper.userId.toString() !== user._id.toString()) {
        throw new ApiError(403, 'You do not own this shopkeeper profile', ERROR_CODES.FORBIDDEN);
      }
      if (shopkeeper.kycStatus === 'APPROVED') {
        throw new ApiError(400, 'KYC is already approved for this shopkeeper', ERROR_CODES.BAD_REQUEST);
      }
    } else if (entityType === 'SHOP') {
      const shop = await Shop.findById(entityId).populate('shopkeeperId');
      if (!shop || shop.shopkeeperId.userId.toString() !== user._id.toString()) {
        throw new ApiError(403, 'You do not own this shop profile', ERROR_CODES.FORBIDDEN);
      }
      if (shop.kycStatus === 'APPROVED') {
        throw new ApiError(400, 'KYC is already approved for this shop', ERROR_CODES.BAD_REQUEST);
      }
    } else {
      throw new ApiError(400, 'Invalid entity type', ERROR_CODES.BAD_REQUEST);
    }

    // 2. Check existing KYC Document transition validation
    let kyc = await KYCDocument.findOne({ entityId, documentType });

    if (kyc) {
      if (kyc.status === 'VERIFIED') {
        throw new ApiError(400, 'This document has already been verified and cannot be resubmitted', ERROR_CODES.BAD_REQUEST);
      }
      if (kyc.status === 'PENDING') {
        throw new ApiError(400, 'A document review is already pending', ERROR_CODES.BAD_REQUEST);
      }
      // If REJECTED, it can become PENDING through resubmission
    }

    const session = await mongoose.startSession();
    let useTransaction = true;
    try {
      session.startTransaction();
    } catch (e) {
      useTransaction = false;
    }

    try {
      if (kyc) {
        // Resubmit: update the rejected document to PENDING
        kyc.documentNumber = documentNumber;
        kyc.documentUrl = documentUrl;
        kyc.status = 'PENDING';
        kyc.rejectionReason = '';
        kyc.submittedAt = new Date();
        await kyc.save({ session: useTransaction ? session : undefined });
      } else {
        // Create new document
        const createdKyc = await KYCDocument.create(
          [
            {
              ownerUserId: user._id,
              entityType,
              entityId,
              documentType,
              documentNumber,
              documentUrl,
              status: 'PENDING',
            },
          ],
          { session: useTransaction ? session : undefined }
        );
        kyc = createdKyc[0];
      }

      // Update kycStatus on the target entity
      if (entityType === 'FRANCHISE') {
        await Franchise.findByIdAndUpdate(entityId, { kycStatus: 'PENDING' }, { session: useTransaction ? session : undefined });
      } else if (entityType === 'SHOPKEEPER') {
        await Shopkeeper.findByIdAndUpdate(
          entityId,
          { kycStatus: 'PENDING', onboardingStatus: 'KYC_SUBMITTED' },
          { session: useTransaction ? session : undefined }
        );
      } else {
        await Shop.findByIdAndUpdate(entityId, { kycStatus: 'PENDING' }, { session: useTransaction ? session : undefined });
      }

      // Create Audit Log
      await AuditLog.create(
        [
          {
            userId: user._id,
            action: 'KYC_SUBMITTED',
            entity: 'KYCDocument',
            entityId: kyc._id.toString(),
            newValue: { status: 'PENDING', documentType },
            ipAddress: '127.0.0.1',
          },
        ],
        { session: useTransaction ? session : undefined }
      );

      // Create in-app notification for the user
      await notificationService.createNotification({
        userId: user._id,
        title: 'KYC Submitted',
        message: `Your KYC document (${documentType}) has been submitted and is under review.`,
        type: 'KYC_SUBMITTED',
      }, { 
        session: useTransaction ? session : undefined,
        dedupeKey: `${kyc._id.toString()}:KYC_SUBMITTED`
      });

      if (useTransaction) {
        await session.commitTransaction();
      }
      return kyc;
    } catch (err) {
      if (useTransaction) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      session.endSession();
    }
  },

  async reviewKyc(adminUser, kycId, status, rejectionReason = '') {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(adminUser.role)) {
      throw new ApiError(403, 'Only administrators can review KYC documents', ERROR_CODES.FORBIDDEN);
    }

    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      throw new ApiError(400, 'Invalid review status', ERROR_CODES.BAD_REQUEST);
    }

    const session = await mongoose.startSession();
    let useTransaction = true;
    try {
      session.startTransaction();
    } catch (e) {
      useTransaction = false;
    }

    try {
      const kyc = await KYCDocument.findById(kycId).session(useTransaction ? session : undefined);
      if (!kyc) {
        throw new ApiError(404, 'KYC Document not found', ERROR_CODES.NOT_FOUND);
      }

      if (kyc.status === 'VERIFIED') {
        throw new ApiError(400, 'Verified KYC documents cannot be altered', ERROR_CODES.BAD_REQUEST);
      }

      const oldStatus = kyc.status;
      kyc.status = status;
      kyc.reviewedAt = new Date();
      kyc.reviewedBy = adminUser._id;
      if (status === 'REJECTED') {
        if (!rejectionReason) {
          throw new ApiError(400, 'Rejection reason is required', ERROR_CODES.BAD_REQUEST);
        }
        kyc.rejectionReason = rejectionReason;
      }
      await kyc.save({ session: useTransaction ? session : undefined });

      const finalStatus = status === 'VERIFIED' ? 'APPROVED' : 'REJECTED';

      if (kyc.entityType === 'FRANCHISE') {
        await Franchise.findByIdAndUpdate(kyc.entityId, { kycStatus: finalStatus }, { session: useTransaction ? session : undefined });
      } else if (kyc.entityType === 'SHOPKEEPER') {
        await Shopkeeper.findByIdAndUpdate(
          kyc.entityId,
          {
            kycStatus: finalStatus,
            onboardingStatus: finalStatus === 'APPROVED' ? 'KYC_APPROVED' : 'PENDING',
          },
          { session: useTransaction ? session : undefined }
        );
      } else {
        await Shop.findByIdAndUpdate(kyc.entityId, { kycStatus: finalStatus }, { session: useTransaction ? session : undefined });
      }

      // Create Audit Log
      await AuditLog.create(
        [
          {
            userId: adminUser._id,
            action: status === 'VERIFIED' ? 'KYC_APPROVED' : 'KYC_REJECTED',
            entity: 'KYCDocument',
            entityId: kyc._id.toString(),
            oldValue: { status: oldStatus },
            newValue: { status, rejectionReason },
            ipAddress: '127.0.0.1',
          },
        ],
        { session: useTransaction ? session : undefined }
      );

      // Create Notification for target user
      const notifType = status === 'VERIFIED' ? 'KYC_APPROVED' : 'KYC_REJECTED';
      await notificationService.createNotification({
        userId: kyc.ownerUserId,
        title: status === 'VERIFIED' ? 'KYC Approved' : 'KYC Rejected',
        message: status === 'VERIFIED' 
          ? `Your KYC document (${kyc.documentType}) has been verified successfully.`
          : `Your KYC document (${kyc.documentType}) was rejected. Reason: ${rejectionReason}`,
        type: notifType,
      }, { 
        session: useTransaction ? session : undefined,
        dedupeKey: `${kyc._id.toString()}:${notifType}`
      });

      try {
        const { emailService } = await import('./emailService.js');
        await emailService.sendKycStatus(kyc, status, rejectionReason);
      } catch (err) {
        console.error('KYC status email failed:', err);
      }

      if (useTransaction) {
        await session.commitTransaction();
      }
      return kyc;
    } catch (err) {
      if (useTransaction) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      session.endSession();
    }
  },

  async getKycById(user, kycId) {
    const kyc = await KYCDocument.findById(kycId);
    if (!kyc) {
      throw new ApiError(404, 'KYC document not found', ERROR_CODES.NOT_FOUND);
    }

    // 1. Owner has access
    if (kyc.ownerUserId.toString() === user._id.toString()) {
      return kyc;
    }

    // 2. Admin has full access
    if (['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      return kyc;
    }

    // 3. Franchise access checking
    const userFranchise = await Franchise.findOne({ userId: user._id, status: 'ACTIVE' }).populate('territoryId');
    if (!userFranchise) {
      throw new ApiError(403, 'Access denied to this KYC document', ERROR_CODES.FORBIDDEN);
    }

    let hasAccess = false;
    if (kyc.entityType === 'SHOP') {
      const shop = await Shop.findById(kyc.entityId);
      if (shop) {
        hasAccess = await territoryAccessService.canAccessShop(user, shop);
      }
    } else if (kyc.entityType === 'SHOPKEEPER') {
      const shopkeeper = await Shopkeeper.findById(kyc.entityId);
      if (shopkeeper) {
        const talukFranchise = await Franchise.findById(shopkeeper.talukFranchiseId);
        if (talukFranchise) {
          hasAccess = await territoryAccessService.canManageFranchise(user, talukFranchise);
        }
      }
    } else if (kyc.entityType === 'FRANCHISE') {
      const targetFranchise = await Franchise.findById(kyc.entityId);
      if (targetFranchise) {
        hasAccess = await territoryAccessService.canManageFranchise(user, targetFranchise);
      }
    }

    if (!hasAccess) {
      throw new ApiError(403, 'Access denied: KYC document is out of your territory scope', ERROR_CODES.FORBIDDEN);
    }

    return kyc;
  },

  async getMyKyc(user) {
    return await KYCDocument.find({ ownerUserId: user._id }).sort({ createdAt: -1 });
  },

  async listKycDocuments(user, filters = {}) {
    if (!['SUPER_ADMIN', 'ADMIN', 'STATE_FRANCHISE', 'DISTRICT_FRANCHISE', 'TALUK_FRANCHISE'].includes(user.role)) {
      throw new ApiError(403, 'Not authorized to view KYC list', ERROR_CODES.FORBIDDEN);
    }

    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.entityType) query.entityType = filters.entityType;

    const docs = await KYCDocument.find(query).sort({ createdAt: -1 }).populate('ownerUserId', 'name email');

    // Filter by territory scope if Franchise user
    if (['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      return docs;
    }

    const userFranchise = await Franchise.findOne({ userId: user._id, status: 'ACTIVE' }).populate('territoryId');
    if (!userFranchise) {
      return [];
    }

    const filteredDocs = [];
    for (const doc of docs) {
      let docAccess = false;
      try {
        if (doc.entityType === 'SHOP') {
          const shop = await Shop.findById(doc.entityId);
          if (shop) docAccess = await territoryAccessService.canAccessShop(user, shop);
        } else if (doc.entityType === 'SHOPKEEPER') {
          const shopkeeper = await Shopkeeper.findById(doc.entityId);
          if (shopkeeper) {
            const talukFranchise = await Franchise.findById(shopkeeper.talukFranchiseId);
            if (talukFranchise) docAccess = await territoryAccessService.canManageFranchise(user, talukFranchise);
          }
        } else if (doc.entityType === 'FRANCHISE') {
          const targetFranchise = await Franchise.findById(doc.entityId);
          if (targetFranchise) docAccess = await territoryAccessService.canManageFranchise(user, targetFranchise);
        }
      } catch (err) {
        docAccess = false;
      }
      if (docAccess) {
        filteredDocs.push(doc);
      }
    }

    return filteredDocs;
  }
};
