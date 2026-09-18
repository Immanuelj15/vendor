import { franchiseService } from '../services/franchiseService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

export const createTerritory = asyncWrapper(async (req, res) => {
  const territory = await franchiseService.createTerritory(req.body);
  return res.status(201).json(new ApiResponse(201, { territory }, 'Territory created successfully'));
});

export const listTerritories = asyncWrapper(async (req, res) => {
  const territories = await franchiseService.listTerritories(req.query);
  return res.status(200).json(new ApiResponse(200, { territories }, 'Territories retrieved'));
});

export const appointFranchise = asyncWrapper(async (req, res) => {
  const franchise = await franchiseService.appointFranchise(req.user, req.body);
  return res.status(201).json(new ApiResponse(201, { franchise }, 'Franchise appointment initiated'));
});

export const approveFranchise = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const franchise = await franchiseService.approveFranchise(req.user, id);
  return res.status(200).json(new ApiResponse(200, { franchise }, 'Franchise approved and role updated'));
});

export const updateFranchiseStatus = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const franchise = await franchiseService.updateFranchiseStatus(req.user, id, status, notes);
  return res.status(200).json(new ApiResponse(200, { franchise }, 'Franchise status updated'));
});

export const getFranchiseById = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const franchise = await franchiseService.getFranchiseById(req.user, id);
  return res.status(200).json(new ApiResponse(200, { franchise }, 'Franchise record retrieved'));
});

export const listFranchises = asyncWrapper(async (req, res) => {
  const franchises = await franchiseService.listFranchises(req.user, req.query);
  return res.status(200).json(new ApiResponse(200, { franchises }, 'Franchises retrieved'));
});

export const getFranchiseChildren = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const children = await franchiseService.getFranchiseChildren(req.user, id);
  return res.status(200).json(new ApiResponse(200, { children }, 'Child franchises retrieved'));
});

export const getFranchiseDashboard = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const dashboard = await franchiseService.getFranchiseDashboard(req.user, id);
  return res.status(200).json(new ApiResponse(200, { dashboard }, 'Franchise dashboard data retrieved'));
});

export const getFranchiseEarnings = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { Franchise } = await import('../models/Franchise.js');
  const { Commission } = await import('../models/Commission.js');

  const franchise = await Franchise.findById(id);
  if (!franchise) {
    return res.status(404).json(new ApiResponse(404, null, 'Franchise not found'));
  }

  // Scoped access check: owner or admin
  if (franchise.userId.toString() !== req.user._id.toString() && !['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json(new ApiResponse(403, null, 'Unauthorized access to franchise earnings'));
  }

  // Filter commissions by type matching franchise type
  const typeMap = {
    'STATE': 'STATE_FRANCHISE_COMMISSION',
    'DISTRICT': 'DISTRICT_FRANCHISE_COMMISSION',
    'TALUK': 'TALUK_FRANCHISE_COMMISSION'
  };
  const commissionType = typeMap[franchise.franchiseType];

  const commissions = await Commission.find({
    recipientUserId: franchise.userId,
    type: commissionType
  }).sort({ createdAt: -1 });

  const totalEarnings = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
  const paidCommission = commissions.filter(c => c.status === 'PAID').reduce((sum, c) => sum + c.commissionAmount, 0);
  const pendingCommission = commissions.filter(c => c.status === 'PENDING').reduce((sum, c) => sum + c.commissionAmount, 0);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        franchiseId: id,
        franchiseType: franchise.franchiseType,
        totalEarnings,
        paidCommission,
        pendingCommission,
        settlementHistory: commissions
      },
      'Franchise earnings retrieved successfully'
    )
  );
});

export const getFranchiseHistory = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { FranchiseHistory } = await import('../models/FranchiseHistory.js');
  
  const history = await FranchiseHistory.find({ franchiseId: id })
    .populate('changedBy', 'name email role')
    .sort({ createdAt: -1 });
    
  return res.status(200).json(new ApiResponse(200, { history }, 'Franchise history retrieved'));
});
