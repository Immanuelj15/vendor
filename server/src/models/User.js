import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, USER_STATUS } from '../constants/roles.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CUSTOMER,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
      index: true,
    },
    adminRoleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminRole',
      default: null,
    },
    avatar: {
      type: String,
      default: '',
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    referralPath: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    attributedShopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      default: null,
      index: true,
    },
    attributedVendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      default: null,
      index: true,
    },
    fairCoinBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    superCoinBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    refreshTokenHash: {
      type: String,
      select: false,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
      index: true,
    },
    mfaSecret: {
      type: String,
      select: false,
    },
    mfaVerifiedAt: {
      type: Date,
      default: null,
    },
    mfaRecoveryCodes: [
      {
        codeHash: { type: String, required: true },
        used: { type: Boolean, default: false },
        usedAt: { type: Date, default: null },
      },
    ],
    mfaFailedAttempts: {
      type: Number,
      default: 0,
    },
    mfaLockedUntil: {
      type: Date,
      default: null,
    },
    authorizedHubs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FulfillmentHub',
      },
    ],
    notificationPreferences: {
      orderUpdates: { type: Boolean, default: true },
      promotional: { type: Boolean, default: false },
      walletAlerts: { type: Boolean, default: true },
      securityAlerts: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for isActive
userSchema.virtual('isActive').get(function () {
  return this.status === USER_STATUS.ACTIVE;
});

// Virtual for lastLogin
userSchema.virtual('lastLogin').get(function () {
  return this.lastLoginAt;
});

// Method to match password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static helper to generate unique referral code
userSchema.statics.generateReferralCode = function (name) {
  const prefix = (name || 'USER')
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 4)
    .toUpperCase()
    .padEnd(4, 'FK');
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${randomDigits}`;
};

export const User = mongoose.model('User', userSchema);
