import { Vendor } from '../models/Vendor.js';
import { User } from '../models/User.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const getVendorNetwork = asyncWrapper(async (req, res) => {
  const { vendorId } = req.params;

  const rootVendor = await Vendor.findById(vendorId).populate('userId', 'name email referralCode');
  if (!rootVendor) {
    throw new ApiError(404, 'Vendor not found', ERROR_CODES.NOT_FOUND);
  }

  // Helper function to build the tree
  const buildTree = async (currentUserId, currentLevel, maxLevel, visitedSet) => {
    if (currentLevel > maxLevel) return [];
    if (visitedSet.has(currentUserId.toString())) {
      // Circular reference detected
      return [{ error: 'Circular reference detected', userId: currentUserId }];
    }

    visitedSet.add(currentUserId.toString());

    // Find children: users who were referred by current user AND are vendors
    const childrenUsers = await User.find({ referredBy: currentUserId }).select('_id name email status');
    
    const nodeChildren = [];
    for (const childUser of childrenUsers) {
      const childVendor = await Vendor.findOne({ userId: childUser._id }).select('_id storeName status');
      if (childVendor) {
        const subTree = await buildTree(childUser._id, currentLevel + 1, maxLevel, new Set(visitedSet));
        nodeChildren.push({
          level: currentLevel,
          vendorId: childVendor._id,
          storeName: childVendor.storeName,
          vendorStatus: childVendor.status,
          user: childUser,
          children: subTree
        });
      }
    }

    return nodeChildren;
  };

  const networkTree = {
    level: 0,
    vendorId: rootVendor._id,
    storeName: rootVendor.storeName,
    vendorStatus: rootVendor.status,
    user: rootVendor.userId,
    children: await buildTree(rootVendor.userId._id, 1, 9, new Set())
  };

  return res.status(200).json(new ApiResponse(200, { network: networkTree }, 'Vendor network retrieved'));
});
