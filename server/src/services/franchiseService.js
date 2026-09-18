import { Franchise } from '../models/Franchise.js';
import { Territory } from '../models/Territory.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { FranchiseHistory } from '../models/FranchiseHistory.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import { territoryAccessService } from './territoryAccessService.js';
import mongoose from 'mongoose';

export const franchiseService = {
  // Territory Management
  async createTerritory(data) {
    // Uniqueness checks
    const existing = await Territory.findOne({ code: data.code.toUpperCase() });
    if (existing) {
      throw new ApiError(400, 'Territory with this code already exists', ERROR_CODES.BAD_REQUEST);
    }

    if (data.parentTerritory) {
      const parent = await Territory.findById(data.parentTerritory);
      if (!parent) {
        throw new ApiError(404, 'Parent territory not found', ERROR_CODES.NOT_FOUND);
      }
      // District parent must be State
      if (data.type === 'DISTRICT' && parent.type !== 'STATE') {
        throw new ApiError(400, 'District parent must be a State territory', ERROR_CODES.BAD_REQUEST);
      }
      // Taluk parent must be District
      if (data.type === 'TALUK' && parent.type !== 'DISTRICT') {
        throw new ApiError(400, 'Taluk parent must be a District territory', ERROR_CODES.BAD_REQUEST);
      }
    }

    const territory = await Territory.create({
      ...data,
      code: data.code.toUpperCase(),
    });
    return territory;
  },

  async listTerritories(filters = {}) {
    const query = {};
    if (filters.type) query.type = filters.type;
    if (filters.parentTerritory) query.parentTerritory = filters.parentTerritory;
    if (filters.state) query.state = new RegExp(filters.state, 'i');
    if (filters.district) query.district = new RegExp(filters.district, 'i');
    if (filters.status) query.status = filters.status;

    return await Territory.find(query).sort({ name: 1 });
  },

  // Appointment Workflow
  async appointFranchise(operatorUser, data) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const territory = await Territory.findById(data.territoryId).session(session);
      if (!territory) {
        throw new ApiError(404, 'Territory not found', ERROR_CODES.NOT_FOUND);
      }

      if (data.franchiseType !== territory.type) {
        throw new ApiError(400, 'Franchise type must match territory type', ERROR_CODES.BAD_REQUEST);
      }

      // Check unique active/pending franchise on territory
      const existing = await Franchise.findOne({
        territoryId: data.territoryId,
        status: { $in: ['PENDING', 'ACTIVE'] },
      }).session(session);

      if (existing) {
        throw new ApiError(400, 'An active or pending franchise already exists for this territory', ERROR_CODES.BAD_REQUEST);
      }

      const targetUser = await User.findById(data.userId).session(session);
      if (!targetUser) {
        throw new ApiError(404, 'Appointed user not found', ERROR_CODES.NOT_FOUND);
      }

      // Authorize operator and validate parent structure
      let parentFranchiseId = data.parentFranchiseId || null;

      if (['SUPER_ADMIN', 'ADMIN'].includes(operatorUser.role)) {
        if (data.franchiseType !== 'STATE' && !parentFranchiseId) {
          throw new ApiError(400, 'Parent franchise is required for DISTRICT and TALUK types', ERROR_CODES.BAD_REQUEST);
        }
      } else if (operatorUser.role === 'STATE_FRANCHISE') {
        if (data.franchiseType !== 'DISTRICT') {
          throw new ApiError(403, 'State Franchise can only appoint District franchises', ERROR_CODES.FORBIDDEN);
        }
        const operatorFranchise = await Franchise.findOne({ userId: operatorUser._id, status: 'ACTIVE' }).populate('territoryId').session(session);
        if (!operatorFranchise || operatorFranchise.territoryId.name !== territory.state) {
          throw new ApiError(403, 'Cannot appoint district franchise outside your State territory', ERROR_CODES.FORBIDDEN);
        }
        parentFranchiseId = operatorFranchise._id;
      } else if (operatorUser.role === 'DISTRICT_FRANCHISE') {
        if (data.franchiseType !== 'TALUK') {
          throw new ApiError(403, 'District Franchise can only appoint Taluk franchises', ERROR_CODES.FORBIDDEN);
        }
        const operatorFranchise = await Franchise.findOne({ userId: operatorUser._id, status: 'ACTIVE' }).populate('territoryId').session(session);
        if (!operatorFranchise || operatorFranchise.territoryId.name !== territory.district) {
          throw new ApiError(403, 'Cannot appoint taluk franchise outside your District territory', ERROR_CODES.FORBIDDEN);
        }
        parentFranchiseId = operatorFranchise._id;
      } else {
        throw new ApiError(403, 'Not authorized to appoint franchises', ERROR_CODES.FORBIDDEN);
      }

      // Verify parent constraints in DB
      if (data.franchiseType === 'DISTRICT') {
        const parent = await Franchise.findById(parentFranchiseId).populate('territoryId').session(session);
        if (!parent || parent.franchiseType !== 'STATE') {
          throw new ApiError(400, 'District franchise parent must be a State franchise', ERROR_CODES.BAD_REQUEST);
        }
        if (parent.territoryId.name !== territory.state) {
          throw new ApiError(400, 'District state does not match parent State franchise', ERROR_CODES.BAD_REQUEST);
        }
      } else if (data.franchiseType === 'TALUK') {
        const parent = await Franchise.findById(parentFranchiseId).populate('territoryId').session(session);
        if (!parent || parent.franchiseType !== 'DISTRICT') {
          throw new ApiError(400, 'Taluk franchise parent must be a District franchise', ERROR_CODES.BAD_REQUEST);
        }
        if (parent.territoryId.name !== territory.district || parent.territoryId.state !== territory.state) {
          throw new ApiError(400, 'Taluk district/state does not match parent District franchise', ERROR_CODES.BAD_REQUEST);
        }
      }

      const franchise = await Franchise.create(
        [
          {
            ...data,
            parentFranchiseId,
            status: 'PENDING',
            createdBy: operatorUser._id,
          },
        ],
        { session }
      );

      await AuditLog.create(
        [
          {
            userId: operatorUser._id,
            action: 'FRANCHISE_APPOINTED',
            entity: 'Franchise',
            entityId: franchise[0]._id.toString(),
            ipAddress: '127.0.0.1',
          },
        ],
        { session }
      );

      await FranchiseHistory.create(
        [
          {
            franchiseId: franchise[0]._id,
            previousStatus: null,
            newStatus: 'PENDING',
            reason: 'Appointed',
            changedBy: operatorUser._id,
          }
        ],
        { session }
      );

      await session.commitTransaction();
      return franchise[0];
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  async approveFranchise(adminUser, franchiseId) {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(adminUser.role)) {
      throw new ApiError(403, 'Only administrators can approve franchises', ERROR_CODES.FORBIDDEN);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const franchise = await Franchise.findById(franchiseId).session(session);
      if (!franchise) {
        throw new ApiError(404, 'Franchise not found', ERROR_CODES.NOT_FOUND);
      }

      if (franchise.status !== 'PENDING') {
        throw new ApiError(400, 'Franchise is not pending approval', ERROR_CODES.BAD_REQUEST);
      }

      const previousStatus = franchise.status;
      franchise.status = 'ACTIVE';
      franchise.activationDate = new Date();
      franchise.approvedBy = adminUser._id;
      franchise.approvedAt = new Date();
      await franchise.save({ session });

      // Update user role to match franchise type
      const targetRole = franchise.franchiseType === 'STATE' 
        ? 'STATE_FRANCHISE' 
        : franchise.franchiseType === 'DISTRICT' 
        ? 'DISTRICT_FRANCHISE' 
        : 'TALUK_FRANCHISE';

      await User.findByIdAndUpdate(franchise.userId, { role: targetRole }).session(session);

      await AuditLog.create(
        [
          {
            userId: adminUser._id,
            action: 'FRANCHISE_APPROVED',
            entity: 'Franchise',
            entityId: franchiseId,
            ipAddress: '127.0.0.1',
          },
        ],
        { session }
      );

      await FranchiseHistory.create(
        [
          {
            franchiseId: franchise._id,
            previousStatus,
            newStatus: 'ACTIVE',
            reason: 'Approved by admin',
            changedBy: adminUser._id,
          }
        ],
        { session }
      );

      await session.commitTransaction();
      return franchise;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  async updateFranchiseStatus(operatorUser, franchiseId, status, notes = '') {
    const franchise = await Franchise.findById(franchiseId);
    if (!franchise) {
      throw new ApiError(404, 'Franchise not found', ERROR_CODES.NOT_FOUND);
    }

    // Auth check
    const isAuthorized = await territoryAccessService.canManageFranchise(operatorUser, franchise);
    if (!isAuthorized) {
      throw new ApiError(403, 'Not authorized to manage this franchise', ERROR_CODES.FORBIDDEN);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const previousStatus = franchise.status;
      franchise.status = status;
      if (notes) franchise.notes = notes;
      await franchise.save({ session });

      // If suspended or terminated, revert user role
      if (['SUSPENDED', 'TERMINATED', 'REJECTED'].includes(status)) {
        await User.findByIdAndUpdate(franchise.userId, { role: 'USER' }).session(session);
      }

      await AuditLog.create(
        [
          {
            userId: operatorUser._id,
            action: 'FRANCHISE_STATUS_CHANGED',
            entity: 'Franchise',
            entityId: franchiseId,
            ipAddress: '127.0.0.1',
          },
        ],
        { session }
      );

      await FranchiseHistory.create(
        [
          {
            franchiseId: franchise._id,
            previousStatus,
            newStatus: status,
            reason: notes || 'Status updated manually',
            changedBy: operatorUser._id,
          }
        ],
        { session }
      );

      await session.commitTransaction();
      return franchise;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  async getFranchiseById(user, franchiseId) {
    const franchise = await Franchise.findById(franchiseId).populate('territoryId userId');
    if (!franchise) {
      throw new ApiError(404, 'Franchise not found', ERROR_CODES.NOT_FOUND);
    }

    const canAccess = await territoryAccessService.canManageFranchise(user, franchise);
    if (!canAccess) {
      throw new ApiError(403, 'Access denied: Scoped territory mismatch', ERROR_CODES.FORBIDDEN);
    }

    return franchise;
  },

  async listFranchises(user, filters = {}) {
    const query = {};

    // Apply filters from client
    if (filters.status) query.status = filters.status;
    if (filters.franchiseType) query.franchiseType = filters.franchiseType;

    // Scoped territory filtering
    if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      const userFranchise = await territoryAccessService.getUserFranchise(user._id);
      if (!userFranchise) {
        return [];
      }

      // Add parent constraints or territory limits
      if (userFranchise.franchiseType === 'STATE') {
        const matchingTerritories = await Territory.find({ state: userFranchise.territoryId.state });
        query.territoryId = { $in: matchingTerritories.map(t => t._id) };
      } else if (userFranchise.franchiseType === 'DISTRICT') {
        const matchingTerritories = await Territory.find({ 
          district: userFranchise.territoryId.district, 
          state: userFranchise.territoryId.state 
        });
        query.territoryId = { $in: matchingTerritories.map(t => t._id) };
      } else if (userFranchise.franchiseType === 'TALUK') {
        query._id = userFranchise._id;
      }
    }

    return await Franchise.find(query).populate('territoryId userId');
  },

  async getFranchiseChildren(user, franchiseId) {
    const franchise = await Franchise.findById(franchiseId);
    if (!franchise) {
      throw new ApiError(404, 'Franchise not found', ERROR_CODES.NOT_FOUND);
    }

    const canAccess = await territoryAccessService.canManageFranchise(user, franchise);
    if (!canAccess) {
      throw new ApiError(403, 'Access denied: Scoped territory mismatch', ERROR_CODES.FORBIDDEN);
    }

    return await Franchise.find({ parentFranchiseId: franchiseId }).populate('territoryId userId');
  },

  async getFranchiseDashboard(user, franchiseId) {
    // 1. Resolve franchise
    let targetFranchise;
    if (franchiseId) {
      targetFranchise = await Franchise.findById(franchiseId).populate('territoryId');
    } else {
      targetFranchise = await territoryAccessService.getUserFranchise(user._id);
    }

    if (!targetFranchise && !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      throw new ApiError(403, 'No active franchise association found', ERROR_CODES.FORBIDDEN);
    }

    const isAuthorized = targetFranchise 
      ? await territoryAccessService.canManageFranchise(user, targetFranchise)
      : true;

    if (!isAuthorized) {
      throw new ApiError(403, 'Access denied: Scoped territory mismatch', ERROR_CODES.FORBIDDEN);
    }

    // 2. Fetch counts based on hierarchy level
    const stats = {};
    const { Shop } = await import('../models/Shop.js');
    const { Shopkeeper } = await import('../models/Shopkeeper.js');

    if (!targetFranchise) { // Admin dashboard counts
      stats.stateCount = await Franchise.countDocuments({ franchiseType: 'STATE', status: 'ACTIVE' });
      stats.districtCount = await Franchise.countDocuments({ franchiseType: 'DISTRICT', status: 'ACTIVE' });
      stats.talukCount = await Franchise.countDocuments({ franchiseType: 'TALUK', status: 'ACTIVE' });
      stats.shopCount = await Shop.countDocuments({});
      stats.shopkeeperCount = await Shopkeeper.countDocuments({});
      return stats;
    }

    const t = targetFranchise.territoryId;

    if (targetFranchise.franchiseType === 'STATE') {
      stats.state = t.state;
      stats.districtCount = await Franchise.countDocuments({ parentFranchiseId: targetFranchise._id, franchiseType: 'DISTRICT', status: 'ACTIVE' });
      
      const districts = await Franchise.find({ parentFranchiseId: targetFranchise._id, franchiseType: 'DISTRICT' });
      stats.talukCount = await Franchise.countDocuments({ parentFranchiseId: { $in: districts.map(d => d._id) }, franchiseType: 'TALUK', status: 'ACTIVE' });
      stats.shopCount = await Shop.countDocuments({ state: t.state, status: 'ACTIVE' });
      stats.shopkeeperCount = await Shopkeeper.countDocuments({ status: 'ACTIVE', talukFranchiseId: { $in: await Franchise.find({ territoryId: { $in: await Territory.find({ state: t.state }) } }).select('_id') } });
    } else if (targetFranchise.franchiseType === 'DISTRICT') {
      stats.district = t.district;
      stats.talukCount = await Franchise.countDocuments({ parentFranchiseId: targetFranchise._id, franchiseType: 'TALUK', status: 'ACTIVE' });
      stats.shopCount = await Shop.countDocuments({ district: t.district, state: t.state, status: 'ACTIVE' });
      stats.shopkeeperCount = await Shopkeeper.countDocuments({ talukFranchiseId: { $in: await Franchise.find({ parentFranchiseId: targetFranchise._id }).select('_id') } });
    } else if (targetFranchise.franchiseType === 'TALUK') {
      stats.taluk = t.taluk;
      stats.shopCount = await Shop.countDocuments({ taluk: t.taluk, district: t.district, state: t.state, status: 'ACTIVE' });
      stats.pendingShopCount = await Shop.countDocuments({ taluk: t.taluk, district: t.district, state: t.state, status: 'PENDING' });
      stats.shopkeeperCount = await Shopkeeper.countDocuments({ talukFranchiseId: targetFranchise._id });
    }

    return stats;
  }
};
