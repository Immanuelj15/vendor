import { Campaign } from '../models/Campaign.js';
import { AuditLog } from '../models/AuditLog.js';
import { campaignService } from '../services/campaignService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { campaignInputSchema } from '../utils/validators.js';

export const getActiveCampaigns = asyncWrapper(async (req, res) => {
  const campaigns = await campaignService.getActiveCampaigns();
  return res.status(200).json(new ApiResponse(200, { campaigns }, 'Active campaigns retrieved'));
});

export const getAdminCampaigns = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const parsedPage = Math.max(1, parseInt(page) || 1);
  const parsedLimit = Math.max(1, parseInt(limit) || 20);
  const skip = (parsedPage - 1) * parsedLimit;

  const campaigns = await Campaign.find().sort({ createdAt: -1 }).skip(skip).limit(parsedLimit);
  const total = await Campaign.countDocuments();

  return res.status(200).json(
    new ApiResponse(
      200,
      { campaigns, total, page: parsedPage, pages: Math.ceil(total / parsedLimit) },
      'Campaigns retrieved for admin'
    )
  );
});

export const getCampaignById = asyncWrapper(async (req, res) => {
  const campaign = await campaignService.getCampaignById(req.params.id);
  return res.status(200).json(new ApiResponse(200, { campaign }, 'Campaign retrieved'));
});

export const createCampaign = asyncWrapper(async (req, res) => {
  const validated = campaignInputSchema.parse(req.body);
  const campaign = await campaignService.createCampaign(validated);

  await AuditLog.create({
    userId: req.user._id,
    action: 'CREATE_CAMPAIGN',
    entity: 'Campaign',
    entityId: campaign._id.toString(),
    newValue: campaign,
    ipAddress: req.ip,
  });

  return res.status(201).json(new ApiResponse(201, { campaign }, 'Campaign created successfully'));
});

export const updateCampaign = asyncWrapper(async (req, res) => {
  const validated = campaignInputSchema.partial().parse(req.body);
  const oldCampaign = await campaignService.getCampaignById(req.params.id);
  const campaign = await campaignService.updateCampaign(req.params.id, validated);

  await AuditLog.create({
    userId: req.user._id,
    action: 'UPDATE_CAMPAIGN',
    entity: 'Campaign',
    entityId: campaign._id.toString(),
    oldValue: oldCampaign,
    newValue: campaign,
    ipAddress: req.ip,
  });

  return res.status(200).json(new ApiResponse(200, { campaign }, 'Campaign updated successfully'));
});

export const updateCampaignStatus = asyncWrapper(async (req, res) => {
  const { isActive } = req.body;
  if (isActive === undefined) {
    throw new ApiError(400, 'isActive flag is required', ERROR_CODES.BAD_REQUEST);
  }

  const oldCampaign = await campaignService.getCampaignById(req.params.id);
  const campaign = await campaignService.updateCampaign(req.params.id, { isActive });

  await AuditLog.create({
    userId: req.user._id,
    action: `UPDATE_CAMPAIGN_STATUS_${isActive ? 'ACTIVE' : 'INACTIVE'}`,
    entity: 'Campaign',
    entityId: campaign._id.toString(),
    oldValue: oldCampaign.isActive,
    newValue: isActive,
    ipAddress: req.ip,
  });

  return res.status(200).json(new ApiResponse(200, { campaign }, `Campaign status updated to ${isActive ? 'Active' : 'Inactive'}`));
});
