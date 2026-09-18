import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import { ROLES } from '../constants/roles.js';
import { Settings } from '../models/Settings.js';
import { authenticate } from './authMiddleware.js';

/**
 * Strict Super Admin Authorization Middleware.
 * Rejects any user who is not authenticated or does not hold the SUPER_ADMIN role.
 */
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required', ERROR_CODES.UNAUTHORIZED);
  }

  if (req.user.role !== ROLES.SUPER_ADMIN) {
    throw new ApiError(403, 'Access denied: Super Admin privilege required', ERROR_CODES.FORBIDDEN);
  }

  next();
};

/**
 * Middleware to check if maintenance mode is active.
 * Super Admins are always allowed through to manage the platform.
 */
export const checkMaintenanceMode = async (req, res, next) => {
  try {
    const maintenanceSetting = await Settings.findOne({ key: 'MAINTENANCE_MODE' });
    const isMaintenance = maintenanceSetting?.value === true || maintenanceSetting?.value === 'true';

    if (isMaintenance) {
      // If user is Super Admin, allow through
      if (req.user && req.user.role === ROLES.SUPER_ADMIN) {
        return next();
      }

      return res.status(503).json({
        success: false,
        message: 'The platform is currently undergoing scheduled maintenance. Please check back shortly.',
        errorCode: 'MAINTENANCE_MODE_ACTIVE',
        isMaintenance: true,
      });
    }

    next();
  } catch (error) {
    // If setting check fails, fail open to avoid downtime
    next();
  }
};

export const authenticateUser = authenticate;
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, 'Access denied: Insufficient permissions', ERROR_CODES.FORBIDDEN);
    }
    next();
  };
};
