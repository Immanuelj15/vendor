import { Franchise } from '../models/Franchise.js';
import { Territory } from '../models/Territory.js';

export const territoryAccessService = {
  async getUserFranchise(userId) {
    return await Franchise.findOne({ userId, status: 'ACTIVE' }).populate('territoryId');
  },

  async canAccessTerritory(user, targetTerritoryId) {
    if (['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      return true;
    }

    const userFranchise = await this.getUserFranchise(user._id);
    if (!userFranchise) {
      return false;
    }

    const targetTerritory = await Territory.findById(targetTerritoryId);
    if (!targetTerritory) {
      return false;
    }

    if (userFranchise.franchiseType === 'STATE') {
      if (targetTerritory.state === userFranchise.territoryId.state || 
          targetTerritory._id.toString() === userFranchise.territoryId._id.toString()) {
        return true;
      }
    }

    if (userFranchise.franchiseType === 'DISTRICT') {
      if (targetTerritory._id.toString() === userFranchise.territoryId._id.toString()) {
        return true;
      }
      if (targetTerritory.type === 'TALUK' && 
          targetTerritory.district === userFranchise.territoryId.district && 
          targetTerritory.state === userFranchise.territoryId.state) {
        return true;
      }
    }

    if (userFranchise.franchiseType === 'TALUK') {
      if (targetTerritory._id.toString() === userFranchise.territoryId._id.toString()) {
        return true;
      }
    }

    return false;
  },

  async canManageFranchise(user, targetFranchise) {
    if (['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      return true;
    }

    const userFranchise = await this.getUserFranchise(user._id);
    if (!userFranchise) {
      return false;
    }

    if (userFranchise.franchiseType === 'STATE') {
      const targetTerritory = await Territory.findById(targetFranchise.territoryId);
      if (targetTerritory && (targetTerritory.state === userFranchise.territoryId.state || 
          targetTerritory._id.toString() === userFranchise.territoryId._id.toString())) {
        return true;
      }
    }

    if (userFranchise.franchiseType === 'DISTRICT') {
      const targetTerritory = await Territory.findById(targetFranchise.territoryId);
      if (targetTerritory && targetTerritory.type === 'TALUK' && 
          targetTerritory.district === userFranchise.territoryId.district && 
          targetTerritory.state === userFranchise.territoryId.state) {
        return true;
      }
    }

    if (targetFranchise._id.toString() === userFranchise._id.toString()) {
      return true;
    }

    return false;
  },

  async canAccessShop(user, shop) {
    if (['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      return true;
    }

    if (user.role === 'SHOPKEEPER') {
      const { Shopkeeper } = await import('../models/Shopkeeper.js');
      const sk = await Shopkeeper.findOne({ userId: user._id });
      if (sk && shop.shopkeeperId.toString() === sk._id.toString()) {
        return true;
      }
      return false;
    }

    const userFranchise = await this.getUserFranchise(user._id);
    if (!userFranchise) {
      return false;
    }

    if (userFranchise.franchiseType === 'STATE') {
      if (shop.state === userFranchise.territoryId.state) {
        return true;
      }
    }

    if (userFranchise.franchiseType === 'DISTRICT') {
      if (shop.district === userFranchise.territoryId.district && 
          shop.state === userFranchise.territoryId.state) {
        return true;
      }
    }

    if (userFranchise.franchiseType === 'TALUK') {
      if (shop.taluk === userFranchise.territoryId.taluk && 
          shop.district === userFranchise.territoryId.district && 
          shop.state === userFranchise.territoryId.state) {
        return true;
      }
    }

    return false;
  }
};
