import { Campaign } from '../models/Campaign.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const campaignService = {
  /**
   * Get all campaigns currently active based on dates and isActive flag.
   */
  async getActiveCampaigns() {
    const now = new Date();
    return await Campaign.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });
  },

  /**
   * Evaluate active campaigns of a specific type to determine the maximum reward multiplier.
   * @param {String} type - Campaign type, e.g. 'PURCHASE_BOOST' or 'REFERRAL_BOOST'
   * @returns {Number} multiplier (default: 1)
   */
  async evaluateCampaign(type) {
    const now = new Date();
    const campaigns = await Campaign.find({
      type,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    if (campaigns.length === 0) return 1;
    return Math.max(...campaigns.map((c) => c.multiplier || 1));
  },

  async getCampaignById(id) {
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      throw new ApiError(404, 'Campaign not found', ERROR_CODES.NOT_FOUND);
    }
    return campaign;
  },

  async createCampaign(data) {
    if (new Date(data.endDate) <= new Date(data.startDate)) {
      throw new ApiError(400, 'Campaign end date must be after start date', ERROR_CODES.BAD_REQUEST);
    }
    return await Campaign.create(data);
  },

  async updateCampaign(id, data) {
    if (data.startDate && data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
      throw new ApiError(400, 'Campaign end date must be after start date', ERROR_CODES.BAD_REQUEST);
    }
    const campaign = await Campaign.findByIdAndUpdate(id, data, { new: true });
    if (!campaign) {
      throw new ApiError(404, 'Campaign not found', ERROR_CODES.NOT_FOUND);
    }
    return campaign;
  },

  async deactivateCampaign(id) {
    const campaign = await Campaign.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!campaign) {
      throw new ApiError(404, 'Campaign not found', ERROR_CODES.NOT_FOUND);
    }
    return campaign;
  },
};
