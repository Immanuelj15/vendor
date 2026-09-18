import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const requirePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ApiError(401, 'User not authenticated', ERROR_CODES.UNAUTHORIZED));
      }

      // SUPER_ADMIN implicitly has all permissions
      if (req.user.role === 'SUPER_ADMIN') {
        return next();
      }

      // Must be an ADMIN to even have permissions
      if (req.user.role !== 'ADMIN') {
        return next(new ApiError(403, 'Access denied. Admin role required.', ERROR_CODES.FORBIDDEN));
      }

      // Need to eagerly load or fetch the AdminRole
      // In a real app, you might attach `adminRoleId` fully populated during authMiddleware.
      // Here, we'll fetch it if it's not populated, though this is a slightly heavier per-request operation.
      // Assuming req.user has been populated or we do it here.
      
      const { User } = await import('../models/User.js');
      const userWithRole = await User.findById(req.user._id).populate('adminRoleId');
      
      if (!userWithRole || !userWithRole.adminRoleId || !userWithRole.adminRoleId.isActive) {
        return next(new ApiError(403, 'Access denied. No active admin role assigned.', ERROR_CODES.FORBIDDEN));
      }

      const hasPerm = userWithRole.adminRoleId.permissions.includes(requiredPermission);

      if (!hasPerm) {
        return next(
          new ApiError(
            403,
            `Access denied. Required permission: [${requiredPermission}]`,
            ERROR_CODES.FORBIDDEN
          )
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
