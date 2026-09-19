import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Referral } from '../models/Referral.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import { tokenService } from './tokenService.js';
import { mlmRewardService } from './mlmRewardService.js';
import { ROLES, USER_STATUS } from '../constants/roles.js';
import { ShopQRCode } from '../models/ShopQRCode.js';
import { Shop } from '../models/Shop.js';
import { CustomerShopAttribution } from '../models/CustomerShopAttribution.js';
import mongoose from 'mongoose';

export const authService = {
  async register(reqBody) {
    const { name, email, password, phone, referralCode, shopQrToken } = reqBody;
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, ...(phone ? [{ phone }] : [])],
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        throw new ApiError(400, 'Email is already registered', ERROR_CODES.CONFLICT);
      }
      if (phone && existingUser.phone === phone) {
        throw new ApiError(400, 'Phone number is already registered', ERROR_CODES.CONFLICT);
      }
    }

    try {
      // Resolve referredBy user if referral code provided
      let referrer = null;
      let referralPath = [];
      if (referralCode) {
        referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
        if (referrer) {
          referralPath = [...referrer.referralPath, referrer._id];
        }
      }

      let qrCode = null;
      let shop = null;
      if (shopQrToken) {
        qrCode = await ShopQRCode.findOne({ publicToken: shopQrToken, status: 'ACTIVE' });
        if (!qrCode) {
          throw new ApiError(400, 'Invalid or revoked QR code', ERROR_CODES.BAD_REQUEST);
        }
        shop = await Shop.findOne({ _id: qrCode.shopId, status: 'ACTIVE' });
        if (!shop) {
          throw new ApiError(400, 'Associated shop is inactive or suspended', ERROR_CODES.BAD_REQUEST);
        }
      }

      const { vendorReferralService } = await import('./vendorReferralService.js');
      let vendorReferral = null;
      if (reqBody.vendorReferralCode) {
        vendorReferral = await vendorReferralService.resolveVendorByCode(reqBody.vendorReferralCode);
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Generate unique referral code for new user
      let newReferralCode = User.generateReferralCode(name);
      let isCodeUnique = false;
      let attempts = 0;
      while (!isCodeUnique && attempts < 5) {
        const codeExists = await User.findOne({ referralCode: newReferralCode });
        if (!codeExists) {
          isCodeUnique = true;
        } else {
          newReferralCode = User.generateReferralCode(name);
          attempts++;
        }
      }

      const user = new User({
        name,
        email: email.toLowerCase(),
        phone: phone ? phone : undefined,
        passwordHash,
        referralCode: newReferralCode,
        referredBy: referrer ? referrer._id : null,
        referralPath,
        role: ROLES.CUSTOMER,
        attributedShopId: shop ? shop._id : null,
        // attributedVendorId will be set via service
      });
      await user.save();

      if (shop) {
        await CustomerShopAttribution.create({
          customerUserId: user._id,
          shopId: shop._id,
          qrCodeId: qrCode._id,
          attributedVia: 'QR_CODE',
          status: 'ACTIVE',
        });
      }

      if (vendorReferral) {
        await vendorReferralService.createPrimaryAttribution(
          user._id,
          vendorReferral.vendorId._id,
          'REFERRAL_LINK',
          vendorReferral.code,
          null
        );
      }

      // Fire MLM registration rewards (welcome bonus + upline coins)
      try {
        await mlmRewardService.processReferralRegistrationRewards(user._id, referrer ? referrer._id : null);
      } catch (err) {
        console.error('[authService] MLM registration reward error:', err);
      }

      const tokens = await tokenService.generateTokens(user);

      const userResponse = user.toObject();
      delete userResponse.passwordHash;
      delete userResponse.refreshTokenHash;

      return { user: userResponse, tokens };
    } catch (err) {
      throw err;
    }
  },

  async login({ email, password, portal }) {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      throw new ApiError(401, 'Invalid email or password', ERROR_CODES.UNAUTHORIZED);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password', ERROR_CODES.UNAUTHORIZED);
    }

    if (user.status === USER_STATUS.SUSPENDED) {
      throw new ApiError(403, 'Your account has been suspended. Please contact platform support.', ERROR_CODES.FORBIDDEN);
    }

    // Strict 4-Role Portal Validation
    if (portal) {
      if (portal === 'CUSTOMER') {
        const isCustomer = user.role === ROLES.USER || user.role === ROLES.CUSTOMER;
        if (!isCustomer) {
          if (user.role === ROLES.VENDOR) {
            throw new ApiError(403, 'This account is registered as a Vendor. Please use Vendor Login.', ERROR_CODES.FORBIDDEN);
          } else if (user.role === ROLES.ADMIN) {
            throw new ApiError(403, 'This account is registered as an Admin. Please use Admin Login.', ERROR_CODES.FORBIDDEN);
          } else if (user.role === ROLES.SUPER_ADMIN) {
            throw new ApiError(403, 'This account is registered as a Super Admin. Please use Super Admin Login.', ERROR_CODES.FORBIDDEN);
          } else {
            throw new ApiError(403, `This role (${user.role}) cannot sign in through Customer portal.`, ERROR_CODES.FORBIDDEN);
          }
        }
      } else if (portal === 'VENDOR') {
        if (user.role !== ROLES.VENDOR) {
          if (user.role === ROLES.USER || user.role === ROLES.CUSTOMER) {
            throw new ApiError(403, 'This account is registered as a Customer. Please use Customer Login.', ERROR_CODES.FORBIDDEN);
          } else if (user.role === ROLES.ADMIN) {
            throw new ApiError(403, 'This account is registered as an Admin. Please use Admin Login.', ERROR_CODES.FORBIDDEN);
          } else if (user.role === ROLES.SUPER_ADMIN) {
            throw new ApiError(403, 'This account is registered as a Super Admin. Please use Super Admin Login.', ERROR_CODES.FORBIDDEN);
          } else {
            throw new ApiError(403, 'Unauthorized. Please use the appropriate login portal.', ERROR_CODES.FORBIDDEN);
          }
        }
      } else if (portal === 'ADMIN') {
        if (user.role !== ROLES.ADMIN && user.role !== ROLES.SUPER_ADMIN) {
          if (user.role === ROLES.USER || user.role === ROLES.CUSTOMER) {
            throw new ApiError(403, 'This account is registered as a Customer. Please use Customer Login.', ERROR_CODES.FORBIDDEN);
          } else if (user.role === ROLES.VENDOR) {
            throw new ApiError(403, 'This account is registered as a Vendor. Please use Vendor Login.', ERROR_CODES.FORBIDDEN);
          } else {
            throw new ApiError(403, 'Unauthorized role for Admin Portal.', ERROR_CODES.FORBIDDEN);
          }
        }
      } else if (portal === 'SUPER_ADMIN') {
        if (user.role !== ROLES.SUPER_ADMIN) {
          throw new ApiError(403, 'Access Denied: Only Super Admins can access this portal.', ERROR_CODES.FORBIDDEN);
        }
      }
    }

    let vendorData = null;
    if (user.role === ROLES.VENDOR) {
      const { Vendor } = await import('../models/Vendor.js');
      const vendor = await Vendor.findOne({ userId: user._id });
      if (vendor) {
        vendorData = {
          id: vendor._id,
          storeName: vendor.storeName,
          status: vendor.status,
          kycStatus: vendor.kycStatus,
        };
        if (portal === 'VENDOR') {
          if (vendor.status === 'PENDING' || vendor.status === 'UNDER_REVIEW') {
            throw new ApiError(403, 'Waiting for Admin Approval. Your vendor registration is currently under review.', ERROR_CODES.FORBIDDEN, { vendorStatus: vendor.status });
          }
          if (vendor.status === 'REJECTED') {
            throw new ApiError(403, 'Your vendor application has been rejected. Please contact platform support.', ERROR_CODES.FORBIDDEN, { vendorStatus: 'REJECTED' });
          }
          if (vendor.status === 'SUSPENDED' || vendor.status === 'BLOCKED') {
            throw new ApiError(403, 'Your vendor account is suspended. Dashboard access is blocked.', ERROR_CODES.FORBIDDEN, { vendorStatus: vendor.status });
          }
        }
      }
    }

    // Enforce Super Admin Mandatory MFA
    if (user.role === ROLES.SUPER_ADMIN && user.mfaEnabled) {
      const jwt = (await import('jsonwebtoken')).default;
      const mfaToken = jwt.sign(
        { id: user._id, role: user.role, type: 'MFA_PENDING' },
        process.env.JWT_SECRET || 'fairkart_jwt_secret_key_prod_2026',
        { expiresIn: '5m' }
      );
      return {
        mfaRequired: true,
        mfaToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    }

    user.lastLoginAt = new Date();
    await user.save();

    const tokens = await tokenService.generateTokens(user);

    const userResponse = user.toObject();
    delete userResponse.passwordHash;
    delete userResponse.refreshTokenHash;

    return { user: { ...userResponse, vendor: vendorData }, tokens };
  },

  async refreshTokens(refreshToken) {
    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token is required', ERROR_CODES.BAD_REQUEST);
    }

    try {
      const user = await tokenService.verifyAndRotateRefreshToken(refreshToken);
      const tokens = await tokenService.generateTokens(user);
      return { user, tokens };
    } catch (err) {
      throw new ApiError(401, 'Invalid or expired refresh token', ERROR_CODES.INVALID_TOKEN);
    }
  },

  async logout(userId) {
    if (userId) {
      await tokenService.revokeRefreshToken(userId);
    }
  },
};
