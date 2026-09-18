import { z } from 'zod';
import { User } from '../models/User.js';
import { UserAddress } from '../models/UserAddress.js';
import { Shopkeeper } from '../models/Shopkeeper.js';
import { Commission } from '../models/Commission.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import bcrypt from 'bcryptjs';

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15).optional(),
  avatar: z.string().optional(),
  notificationPreferences: z.object({
    orderUpdates: z.boolean().optional(),
    promotional: z.boolean().optional(),
    walletAlerts: z.boolean().optional(),
    securityAlerts: z.boolean().optional(),
  }).optional(),
});

const updatePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

const addressSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  streetAddress: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(5),
  country: z.string().default('India').optional(),
  isDefault: z.boolean().default(false).optional(),
});

export const userController = {
  // Get current user profile
  async getProfile(req, res, next) {
    try {
      const user = await User.findById(req.user._id).select('-passwordHash -refreshTokenHash');
      if (!user) {
        throw new ApiError(404, 'User profile not found', ERROR_CODES.NOT_FOUND);
      }
      res.status(200).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  // Update current user profile
  async updateProfile(req, res, next) {
    try {
      const validatedData = updateProfileSchema.parse(req.body);
      const user = await User.findById(req.user._id);
      if (!user) {
        throw new ApiError(404, 'User profile not found', ERROR_CODES.NOT_FOUND);
      }

      // Check restrictions (email/phone locked if KYC is verified)
      const shopkeeper = await Shopkeeper.findOne({ userId: user._id });
      const hasApprovedKyc = shopkeeper && shopkeeper.kycStatus === 'APPROVED';

      if (hasApprovedKyc) {
        if (validatedData.email && validatedData.email.toLowerCase() !== user.email.toLowerCase()) {
          throw new ApiError(400, 'Cannot change email address after KYC approval', ERROR_CODES.BAD_REQUEST);
        }
        if (validatedData.phone && validatedData.phone !== user.phone) {
          throw new ApiError(400, 'Cannot change phone number after KYC approval', ERROR_CODES.BAD_REQUEST);
        }
      }

      // Handle duplicate checks
      if (validatedData.email && validatedData.email.toLowerCase() !== user.email.toLowerCase()) {
        const emailExists = await User.findOne({ email: validatedData.email.toLowerCase() });
        if (emailExists) {
          throw new ApiError(400, 'Email address already in use', ERROR_CODES.BAD_REQUEST);
        }
        user.email = validatedData.email.toLowerCase();
      }

      if (validatedData.phone && validatedData.phone !== user.phone) {
        const phoneExists = await User.findOne({ phone: validatedData.phone });
        if (phoneExists) {
          throw new ApiError(400, 'Phone number already in use', ERROR_CODES.BAD_REQUEST);
        }
        user.phone = validatedData.phone;
      }

      if (validatedData.name) user.name = validatedData.name;
      if (validatedData.avatar !== undefined) user.avatar = validatedData.avatar;
      
      if (validatedData.notificationPreferences) {
        user.notificationPreferences = {
          ...user.notificationPreferences,
          ...validatedData.notificationPreferences,
        };
      }

      await user.save();

      const updatedUser = await User.findById(user._id).select('-passwordHash -refreshTokenHash');
      res.status(200).json({ success: true, data: updatedUser });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return next(new ApiError(400, err.errors[0].message, ERROR_CODES.VALIDATION_ERROR));
      }
      next(err);
    }
  },

  // Update current user password
  async updatePassword(req, res, next) {
    try {
      const validatedData = updatePasswordSchema.parse(req.body);
      const user = await User.findById(req.user._id).select('+passwordHash');
      if (!user) {
        throw new ApiError(404, 'User profile not found', ERROR_CODES.NOT_FOUND);
      }

      const isMatch = await user.comparePassword(validatedData.oldPassword);
      if (!isMatch) {
        throw new ApiError(400, 'Incorrect old password', ERROR_CODES.BAD_REQUEST);
      }

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(validatedData.newPassword, salt);
      await user.save();

      res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return next(new ApiError(400, err.errors[0].message, ERROR_CODES.VALIDATION_ERROR));
      }
      next(err);
    }
  },

  // GET User Addresses
  async getAddresses(req, res, next) {
    try {
      const addresses = await UserAddress.find({ userId: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
      res.status(200).json({ success: true, data: addresses });
    } catch (err) {
      next(err);
    }
  },

  // POST Create User Address
  async createAddress(req, res, next) {
    try {
      const validatedData = addressSchema.parse(req.body);
      
      // If this is the user's first address, force it to be default
      const addressCount = await UserAddress.countDocuments({ userId: req.user._id });
      const isDefault = addressCount === 0 ? true : !!validatedData.isDefault;

      const address = await UserAddress.create({
        ...validatedData,
        userId: req.user._id,
        isDefault,
      });

      res.status(201).json({ success: true, data: address });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return next(new ApiError(400, err.errors[0].message, ERROR_CODES.VALIDATION_ERROR));
      }
      next(err);
    }
  },

  // PUT Update User Address
  async updateAddress(req, res, next) {
    try {
      const { id } = req.params;
      const validatedData = addressSchema.parse(req.body);

      const address = await UserAddress.findOne({ _id: id, userId: req.user._id });
      if (!address) {
        throw new ApiError(404, 'Address not found', ERROR_CODES.NOT_FOUND);
      }

      // Update fields
      address.name = validatedData.name;
      address.phone = validatedData.phone;
      address.streetAddress = validatedData.streetAddress;
      address.city = validatedData.city;
      address.state = validatedData.state;
      address.postalCode = validatedData.postalCode;
      if (validatedData.country) address.country = validatedData.country;
      if (validatedData.isDefault !== undefined) address.isDefault = validatedData.isDefault;

      await address.save();

      res.status(200).json({ success: true, data: address });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return next(new ApiError(400, err.errors[0].message, ERROR_CODES.VALIDATION_ERROR));
      }
      next(err);
    }
  },

  // DELETE User Address
  async deleteAddress(req, res, next) {
    try {
      const { id } = req.params;
      const address = await UserAddress.findOne({ _id: id, userId: req.user._id });
      if (!address) {
        throw new ApiError(404, 'Address not found', ERROR_CODES.NOT_FOUND);
      }

      const wasDefault = address.isDefault;
      await UserAddress.deleteOne({ _id: id });

      // If we deleted the default address, set another address as default
      if (wasDefault) {
        const anotherAddress = await UserAddress.findOne({ userId: req.user._id });
        if (anotherAddress) {
          anotherAddress.isDefault = true;
          await anotherAddress.save();
        }
      }

      res.status(200).json({ success: true, message: 'Address deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  // GET User Commissions
  async getCommissions(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const status = req.query.status || '';

      const query = { recipientUserId: req.user._id };
      if (status) {
        query.status = status;
      }

      const skip = (page - 1) * limit;
      const list = await Commission.find(query)
        .populate('orderId', 'orderNumber total')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Commission.countDocuments(query);

      res.status(200).json({
        success: true,
        data: {
          list,
          total,
          page,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // GET User Fiat Wallet
  async getWallet(req, res, next) {
    try {
      const { walletService } = await import('../services/walletService.js');
      const wallet = await walletService.getWallet(req.user._id);
      res.status(200).json({ success: true, data: { wallet } });
    } catch (err) {
      next(err);
    }
  },

  // GET User Fiat Wallet Transactions
  async getWalletTransactions(req, res, next) {
    try {
      const { walletService } = await import('../services/walletService.js');
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const result = await walletService.getTransactions(req.user._id, { page, limit });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
};
