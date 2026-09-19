import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Settings } from '../models/Settings.js';
import { AuditLog } from '../models/AuditLog.js';
import { AdminRole } from '../models/AdminRole.js';
import { Payment } from '../models/Payment.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import { ROLES, USER_STATUS } from '../constants/roles.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { logAdminAction } from '../services/auditLogService.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';
import { CustomerSubscriptionPlan } from '../models/CustomerSubscriptionPlan.js';
import { VendorWithdrawal } from '../models/VendorWithdrawal.js';
import { VendorLedger } from '../models/VendorLedger.js';
import { PlatformLedger } from '../models/PlatformLedger.js';
import { Commission } from '../models/Commission.js';
import { Referral } from '../models/Referral.js';
import { mlmRewardService } from '../services/mlmRewardService.js';
import { notificationService } from '../services/notificationService.js';

// ==========================================
// 1. DASHBOARD & OVERVIEW
// ==========================================
export const getDashboardStats = asyncWrapper(async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    totalAdmins,
    totalVendors,
    totalProducts,
    totalOrders,
    revenueAgg,
    fairCoinsAgg,
    roleCountsAgg,
    recentAuditLogs,
    maintenanceSetting,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: USER_STATUS.ACTIVE }),
    User.countDocuments({ status: USER_STATUS.SUSPENDED }),
    User.countDocuments({ role: { $in: [ROLES.ADMIN, ROLES.SUPER_ADMIN] } }),
    Vendor.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { 'paymentInfo.status': { $in: ['COMPLETED', 'PAID'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    User.aggregate([
      { $group: { _id: null, total: { $sum: '$fairCoinBalance' } } },
    ]),
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]),
    AuditLog.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(10),
    Settings.findOne({ key: 'MAINTENANCE_MODE' }),
  ]);

  const totalRevenue = revenueAgg[0]?.total || 0;
  const totalFairCoins = fairCoinsAgg[0]?.total || 0;
  const roleDistribution = roleCountsAgg.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});

  const isMaintenanceMode =
    maintenanceSetting?.value === true || maintenanceSetting?.value === 'true';

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        metrics: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          suspendedUsers,
          totalAdmins,
          totalVendors,
          totalProducts,
          totalOrders,
          totalRevenue,
          totalFairCoins,
          isMaintenanceMode,
        },
        roleDistribution,
        recentAuditLogs,
      },
      'Super Admin dashboard metrics retrieved successfully'
    )
  );
});

// ==========================================
// 2. USER MANAGEMENT
// ==========================================
export const getUsers = asyncWrapper(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    role = '',
    status = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  if (search) {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { referralCode: searchRegex },
    ];
  }

  if (role) {
    filter.role = role;
  }

  if (status) {
    filter.status = status;
  }

  const sortCriteria = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-passwordHash -refreshTokenHash')
      .populate('adminRoleId', 'name')
      .sort(sortCriteria)
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
      'Users retrieved successfully'
    )
  );
});

export const getUserById = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id)
    .select('-passwordHash -refreshTokenHash')
    .populate('adminRoleId')
    .populate('referredBy', 'name email referralCode');

  if (!user) {
    throw new ApiError(404, 'User not found', ERROR_CODES.NOT_FOUND);
  }

  // Retrieve optional vendor details if user is a vendor
  const vendor = await Vendor.findOne({ userId: user._id });

  return res.status(200).json(
    new ApiResponse(200, { user, vendor }, 'User details retrieved')
  );
});

export const updateUser = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { name, phone, role, status, adminRoleId } = req.body;

  const targetUser = await User.findById(id);
  if (!targetUser) {
    throw new ApiError(404, 'User not found', ERROR_CODES.NOT_FOUND);
  }

  // SAFEGUARD: Prevent demoting or deactivating the last active SUPER_ADMIN
  if (
    targetUser.role === ROLES.SUPER_ADMIN &&
    ((role && role !== ROLES.SUPER_ADMIN) || (status && status !== USER_STATUS.ACTIVE))
  ) {
    const activeSuperAdmins = await User.countDocuments({
      role: ROLES.SUPER_ADMIN,
      status: USER_STATUS.ACTIVE,
    });
    if (activeSuperAdmins <= 1) {
      throw new ApiError(
        400,
        'This is the last Super Admin account and cannot be removed, demoted, or deactivated.',
        ERROR_CODES.BAD_REQUEST
      );
    }
  }

  const oldValues = {
    name: targetUser.name,
    phone: targetUser.phone,
    role: targetUser.role,
    status: targetUser.status,
  };

  if (name) targetUser.name = name.trim();
  if (phone !== undefined) targetUser.phone = phone.trim() || undefined;
  if (role) {
    if (!Object.values(ROLES).includes(role)) {
      throw new ApiError(400, `Invalid role: ${role}`, ERROR_CODES.BAD_REQUEST);
    }
    targetUser.role = role;
  }
  if (status) {
    if (!Object.values(USER_STATUS).includes(status)) {
      throw new ApiError(400, `Invalid status: ${status}`, ERROR_CODES.BAD_REQUEST);
    }
    targetUser.status = status;
  }
  if (adminRoleId !== undefined) {
    targetUser.adminRoleId = adminRoleId || null;
  }

  await targetUser.save();

  await logAdminAction({
    userId: req.user._id,
    action: 'USER_UPDATED',
    entity: 'User',
    entityId: targetUser._id,
    oldValue: oldValues,
    newValue: {
      name: targetUser.name,
      phone: targetUser.phone,
      role: targetUser.role,
      status: targetUser.status,
    },
    ipAddress: req.ip,
  });

  const responseUser = targetUser.toObject();
  delete responseUser.passwordHash;
  delete responseUser.refreshTokenHash;

  return res.status(200).json(
    new ApiResponse(200, { user: responseUser }, 'User updated successfully')
  );
});

export const deleteUser = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  const targetUser = await User.findById(id);
  if (!targetUser) {
    throw new ApiError(404, 'User not found', ERROR_CODES.NOT_FOUND);
  }

  // SAFEGUARD: Prevent deleting the last SUPER_ADMIN
  if (targetUser.role === ROLES.SUPER_ADMIN) {
    const totalSuperAdmins = await User.countDocuments({ role: ROLES.SUPER_ADMIN });
    if (totalSuperAdmins <= 1) {
      throw new ApiError(
        400,
        'This is the last Super Admin account and cannot be removed.',
        ERROR_CODES.BAD_REQUEST
      );
    }
  }

  await User.findByIdAndDelete(id);

  await logAdminAction({
    userId: req.user._id,
    action: 'USER_DELETED',
    entity: 'User',
    entityId: id,
    oldValue: { name: targetUser.name, email: targetUser.email, role: targetUser.role },
    newValue: null,
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new ApiResponse(200, { deletedId: id }, 'User deleted successfully')
  );
});

export const resetUserPassword = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password || password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters long', ERROR_CODES.BAD_REQUEST);
  }

  const targetUser = await User.findById(id);
  if (!targetUser) {
    throw new ApiError(404, 'User not found', ERROR_CODES.NOT_FOUND);
  }

  const salt = await bcrypt.genSalt(10);
  targetUser.passwordHash = await bcrypt.hash(password, salt);
  targetUser.refreshTokenHash = null; // Invalidate active sessions
  await targetUser.save();

  await logAdminAction({
    userId: req.user._id,
    action: 'USER_PASSWORD_RESET',
    entity: 'User',
    entityId: targetUser._id,
    oldValue: null,
    newValue: { email: targetUser.email },
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new ApiResponse(200, null, 'User password reset successfully')
  );
});

// ==========================================
// 3. ADMIN MANAGEMENT (ADMIN & SUPER ADMIN)
// ==========================================
export const getAdmins = asyncWrapper(async (req, res) => {
  const admins = await User.find({
    role: { $in: [ROLES.ADMIN, ROLES.SUPER_ADMIN] },
  })
    .select('-passwordHash -refreshTokenHash')
    .populate('adminRoleId')
    .sort({ role: 1, createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, { admins }, 'Admins list retrieved successfully')
  );
});

export const createAdmin = asyncWrapper(async (req, res) => {
  const { name, email, phone, password, role = ROLES.ADMIN, adminRoleId } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email, and password are required', ERROR_CODES.BAD_REQUEST);
  }

  if (![ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(role)) {
    throw new ApiError(400, 'Role must be either ADMIN or SUPER_ADMIN', ERROR_CODES.BAD_REQUEST);
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new ApiError(400, 'User with this email already exists', ERROR_CODES.CONFLICT);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newAdmin = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone ? phone.trim() : undefined,
    passwordHash,
    role,
    status: USER_STATUS.ACTIVE,
    emailVerified: true,
    adminRoleId: role === ROLES.SUPER_ADMIN ? null : adminRoleId || null,
  });

  await logAdminAction({
    userId: req.user._id,
    action: role === ROLES.SUPER_ADMIN ? 'SUPER_ADMIN_CREATED_SUPER_ADMIN' : 'SUPER_ADMIN_CREATED_ADMIN',
    entity: 'User',
    entityId: newAdmin._id,
    oldValue: null,
    newValue: { name: newAdmin.name, email: newAdmin.email, role: newAdmin.role },
    ipAddress: req.ip,
  });

  const responseUser = newAdmin.toObject();
  delete responseUser.passwordHash;
  delete responseUser.refreshTokenHash;

  return res.status(201).json(
    new ApiResponse(201, { admin: responseUser }, 'Admin created successfully')
  );
});

export const updateAdmin = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { name, phone, role, status, adminRoleId } = req.body;

  const targetAdmin = await User.findOne({
    _id: id,
    role: { $in: [ROLES.ADMIN, ROLES.SUPER_ADMIN] },
  });

  if (!targetAdmin) {
    throw new ApiError(404, 'Admin not found', ERROR_CODES.NOT_FOUND);
  }

  // SAFEGUARD: Prevent demoting or deactivating the last active SUPER_ADMIN
  if (
    targetAdmin.role === ROLES.SUPER_ADMIN &&
    ((role && role !== ROLES.SUPER_ADMIN) || (status && status !== USER_STATUS.ACTIVE))
  ) {
    const activeSuperAdmins = await User.countDocuments({
      role: ROLES.SUPER_ADMIN,
      status: USER_STATUS.ACTIVE,
    });
    if (activeSuperAdmins <= 1) {
      throw new ApiError(
        400,
        'This is the last Super Admin account and cannot be removed or demoted.',
        ERROR_CODES.BAD_REQUEST
      );
    }
  }

  const oldValues = {
    name: targetAdmin.name,
    phone: targetAdmin.phone,
    role: targetAdmin.role,
    status: targetAdmin.status,
    adminRoleId: targetAdmin.adminRoleId,
  };

  if (name) targetAdmin.name = name.trim();
  if (phone !== undefined) targetAdmin.phone = phone.trim() || undefined;
  if (role && [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(role)) {
    targetAdmin.role = role;
  }
  if (status && Object.values(USER_STATUS).includes(status)) {
    targetAdmin.status = status;
  }
  if (adminRoleId !== undefined) {
    targetAdmin.adminRoleId = targetAdmin.role === ROLES.SUPER_ADMIN ? null : adminRoleId || null;
  }

  await targetAdmin.save();

  await logAdminAction({
    userId: req.user._id,
    action: 'ADMIN_UPDATED',
    entity: 'User',
    entityId: targetAdmin._id,
    oldValue: oldValues,
    newValue: {
      name: targetAdmin.name,
      role: targetAdmin.role,
      status: targetAdmin.status,
    },
    ipAddress: req.ip,
  });

  const responseAdmin = targetAdmin.toObject();
  delete responseAdmin.passwordHash;
  delete responseAdmin.refreshTokenHash;

  return res.status(200).json(
    new ApiResponse(200, { admin: responseAdmin }, 'Admin updated successfully')
  );
});

export const deleteAdmin = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  const targetAdmin = await User.findOne({
    _id: id,
    role: { $in: [ROLES.ADMIN, ROLES.SUPER_ADMIN] },
  });

  if (!targetAdmin) {
    throw new ApiError(404, 'Admin not found', ERROR_CODES.NOT_FOUND);
  }

  // SAFEGUARD: Prevent deleting the last SUPER_ADMIN
  if (targetAdmin.role === ROLES.SUPER_ADMIN) {
    const totalSuperAdmins = await User.countDocuments({ role: ROLES.SUPER_ADMIN });
    if (totalSuperAdmins <= 1) {
      throw new ApiError(
        400,
        'This is the last Super Admin account and cannot be removed.',
        ERROR_CODES.BAD_REQUEST
      );
    }
  }

  await User.findByIdAndDelete(id);

  await logAdminAction({
    userId: req.user._id,
    action: 'ADMIN_DELETED',
    entity: 'User',
    entityId: id,
    oldValue: { name: targetAdmin.name, email: targetAdmin.email, role: targetAdmin.role },
    newValue: null,
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new ApiResponse(200, { deletedId: id }, 'Admin deleted successfully')
  );
});

// ==========================================
// 4. ANALYTICS & REPORTING
// ==========================================
export const getAnalytics = asyncWrapper(async (req, res) => {
  const [
    registrationsByMonth,
    roleDistribution,
    userStatusDistribution,
    orderStatusDistribution,
    revenueByMonth,
  ] = await Promise.all([
    // User registrations grouped by month
    User.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]),
    // Role distribution
    User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]),
    // User status distribution
    User.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
    // Order status and revenue
    Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
        },
      },
    ]),
    // Monthly revenue
    Order.aggregate([
      {
        $match: {
          'paymentInfo.status': { $in: ['COMPLETED', 'PAID'] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        registrationsByMonth,
        roleDistribution,
        userStatusDistribution,
        orderStatusDistribution,
        revenueByMonth,
      },
      'Super Admin analytics data retrieved successfully'
    )
  );
});

// ==========================================
// 5. AUDIT LOGS
// ==========================================
export const getAuditLogs = asyncWrapper(async (req, res) => {
  const {
    page = 1,
    limit = 25,
    action = '',
    entity = '',
    search = '',
    startDate = '',
    endDate = '',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  if (action) filter.action = action;
  if (entity) filter.entity = entity;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    AuditLog.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
      'Audit logs retrieved successfully'
    )
  );
});

// ==========================================
// 6. SYSTEM SETTINGS & MAINTENANCE MODE
// ==========================================
export const getSettings = asyncWrapper(async (req, res) => {
  const settingsList = await Settings.find();

  // Convert array to category map, strictly excluding any secrets
  const sanitized = {};
  for (const s of settingsList) {
    // Exclude any keys containing secret or token
    if (/secret|token|password|key/i.test(s.key) && !/reward|fair_coin|limit/i.test(s.key)) {
      continue;
    }
    sanitized[s.key] = s.value;
  }

  return res.status(200).json(
    new ApiResponse(200, { settings: sanitized, raw: settingsList }, 'Settings retrieved')
  );
});

export const updateSettings = asyncWrapper(async (req, res) => {
  const { settings } = req.body; // Key-value object: { [key]: value }

  if (!settings || typeof settings !== 'object') {
    throw new ApiError(400, 'Invalid settings payload', ERROR_CODES.BAD_REQUEST);
  }

  const updatedEntries = [];

  for (const [key, value] of Object.entries(settings)) {
    // Prevent overriding system critical secrets through this endpoint
    if (/secret|token|password|key/i.test(key) && !/reward|fair_coin|limit/i.test(key)) {
      continue;
    }

    const doc = await Settings.findOneAndUpdate(
      { key },
      { key, value, updatedBy: req.user._id },
      { upsert: true, new: true }
    );
    updatedEntries.push(doc);
  }

  await logAdminAction({
    userId: req.user._id,
    action: 'SYSTEM_SETTINGS_UPDATED',
    entity: 'Settings',
    entityId: 'SYSTEM',
    oldValue: null,
    newValue: settings,
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new ApiResponse(200, { updated: updatedEntries }, 'Settings updated successfully')
  );
});

export const toggleMaintenanceMode = asyncWrapper(async (req, res) => {
  const { enabled } = req.body;

  const currentDoc = await Settings.findOne({ key: 'MAINTENANCE_MODE' });
  const newStatus = typeof enabled === 'boolean' ? enabled : !(currentDoc?.value === true);

  const doc = await Settings.findOneAndUpdate(
    { key: 'MAINTENANCE_MODE' },
    { key: 'MAINTENANCE_MODE', value: newStatus, updatedBy: req.user._id },
    { upsert: true, new: true }
  );

  await logAdminAction({
    userId: req.user._id,
    action: 'MAINTENANCE_MODE_TOGGLED',
    entity: 'Settings',
    entityId: 'MAINTENANCE_MODE',
    oldValue: currentDoc?.value || false,
    newValue: newStatus,
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { isMaintenanceMode: newStatus },
      `Maintenance mode ${newStatus ? 'ENABLED' : 'DISABLED'} successfully`
    )
  );
});

// ==========================================
// 7. ROLES & PERMISSIONS MATRIX
// ==========================================
export const getRolesMatrix = asyncWrapper(async (req, res) => {
  const customAdminRoles = await AdminRole.find().sort({ name: 1 });

  const defaultMatrix = [
    {
      role: ROLES.SUPER_ADMIN,
      displayName: 'Super Admin',
      description: 'Supreme administrator with full system, financial, user, and configuration authority',
      permissions: [
        'super_admin.access',
        'admin.manage',
        'user.manage',
        'vendor.manage',
        'finance.manage',
        'settings.manage',
        'audit_logs.view',
        'maintenance.toggle',
      ],
      isSystem: true,
    },
    {
      role: ROLES.ADMIN,
      displayName: 'Admin',
      description: 'Platform manager for everyday marketplace catalog, orders, and review operations',
      permissions: [
        'catalog.manage',
        'vendor.review',
        'order.view',
        'customer.view',
        'dispute.resolve',
      ],
      isSystem: true,
    },
    {
      role: ROLES.VENDOR,
      displayName: 'Vendor / Merchant',
      description: 'Marketplace merchant managing product listings, inventory, and vendor sub-orders',
      permissions: ['vendor.products', 'vendor.orders', 'vendor.finance', 'vendor.qr'],
      isSystem: true,
    },
    {
      role: ROLES.USER,
      displayName: 'Customer / User',
      description: 'Standard platform customer, referral network participant, and coin holder',
      permissions: ['profile.view', 'orders.create', 'referrals.earn', 'spin.play'],
      isSystem: true,
    },
  ];

  return res.status(200).json(
    new ApiResponse(
      200,
      { defaultMatrix, customAdminRoles },
      'Roles and permissions matrix retrieved successfully'
    )
  );
});

// ==========================================
// 8. 9-LEVEL MLM NETWORK & TREE VISUALIZATION
// ==========================================
export const getMLMTree = asyncWrapper(async (req, res) => {
  const { userId, search } = req.query;
  let targetUser = null;

  if (search) {
    const cleanSearch = search.trim();
    targetUser = await User.findOne({
      $or: [
        { email: cleanSearch.toLowerCase() },
        { referralCode: cleanSearch.toUpperCase() },
        ...(mongoose.Types.ObjectId.isValid(cleanSearch) ? [{ _id: cleanSearch }] : []),
      ],
    }).select('name email referralCode fairCoinBalance role createdAt');
  } else if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    targetUser = await User.findById(userId).select('name email referralCode fairCoinBalance role createdAt');
  }

  if (!targetUser) {
    // If no search or not found, pick the first user who has active referrals, or the logged-in super admin
    const activeReferrer = await Referral.findOne().select('userId');
    if (activeReferrer) {
      targetUser = await User.findById(activeReferrer.userId).select('name email referralCode fairCoinBalance role createdAt');
    }
    if (!targetUser) {
      targetUser = await User.findById(req.user._id).select('name email referralCode fairCoinBalance role createdAt');
    }
  }

  if (!targetUser) {
    throw new ApiError(404, 'No network user found', ERROR_CODES.NOT_FOUND);
  }

  const treeData = await mlmRewardService.buildReferralTree(targetUser._id, 9);

  return res.status(200).json(
    new ApiResponse(
      200,
      { targetUser, treeData },
      '9-Level MLM referral tree loaded successfully'
    )
  );
});

export const getMLMCommissions = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 20, type = '' } = req.query;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (type) {
    query.type = type;
  } else {
    query.type = { $in: ['MLM_VENDOR_SUBSCRIPTION_COMMISSION', 'MLM_UPLINE_COMMISSION'] };
  }

  const [commissions, total, statsAgg] = await Promise.all([
    Commission.find(query)
      .populate('recipientUserId', 'name email referralCode')
      .populate('vendorId', 'storeName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Commission.countDocuments(query),
    Commission.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$level',
          totalAmount: { $sum: '$commissionAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const totalDistributed = statsAgg.reduce((acc, curr) => acc + curr.totalAmount, 0);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        commissions,
        stats: {
          totalDistributed,
          levelBreakdown: statsAgg,
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
      'MLM commission transactions retrieved successfully'
    )
  );
});

// ==========================================
// 9. COMMISSION RULES & SETTINGS
// ==========================================
export const getCommissionSettings = asyncWrapper(async (req, res) => {
  const [mlmSetting, platformSetting] = await Promise.all([
    Settings.findOne({ key: { $in: ['MLM_COMMISSION_RATES', 'MLM_CONFIG'] } }),
    Settings.findOne({ key: 'PLATFORM_COMMISSION_PERCENT' }),
  ]);

  const platformCommissionPercent = platformSetting?.value !== undefined ? Number(platformSetting.value) : 5;
  const vendorPayoutPercent = 100 - platformCommissionPercent;

  let mlmConfig = mlmSetting?.value;
  if (!mlmConfig || !Array.isArray(mlmConfig.levels)) {
    mlmConfig = {
      maxLevels: 9,
      levels: [
        { level: 1, percentage: 10, name: 'Level 1 (Direct)' },
        { level: 2, percentage: 5, name: 'Level 2' },
        { level: 3, percentage: 3, name: 'Level 3' },
        { level: 4, percentage: 2, name: 'Level 4' },
        { level: 5, percentage: 1, name: 'Level 5' },
        { level: 6, percentage: 1, name: 'Level 6' },
        { level: 7, percentage: 1, name: 'Level 7' },
        { level: 8, percentage: 1, name: 'Level 8' },
        { level: 9, percentage: 1, name: 'Level 9' },
      ],
    };
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        platformCommissionPercent,
        vendorPayoutPercent,
        mlmConfig,
      },
      'Commission settings retrieved successfully'
    )
  );
});

export const updateCommissionSettings = asyncWrapper(async (req, res) => {
  const { platformCommissionPercent, levels } = req.body;

  if (platformCommissionPercent !== undefined) {
    const num = Number(platformCommissionPercent);
    if (isNaN(num) || num < 0 || num > 100) {
      throw new ApiError(400, 'Platform commission percentage must be a number between 0 and 100', ERROR_CODES.BAD_REQUEST);
    }

    await Settings.findOneAndUpdate(
      { key: 'PLATFORM_COMMISSION_PERCENT' },
      { value: num, category: 'FINANCE', updatedBy: req.user._id },
      { upsert: true, new: true }
    );
  }

  if (levels !== undefined) {
    if (!Array.isArray(levels) || levels.length !== 9) {
      throw new ApiError(400, 'MLM configuration must specify exactly 9 levels', ERROR_CODES.BAD_REQUEST);
    }

    let sum = 0;
    const cleanLevels = [];
    for (let i = 0; i < 9; i++) {
      const lvl = levels[i];
      const p = Number(lvl.percentage);
      if (isNaN(p) || p < 0 || p > 100) {
        throw new ApiError(400, `Level ${i + 1} percentage must be between 0 and 100`, ERROR_CODES.BAD_REQUEST);
      }
      sum += p;
      cleanLevels.push({
        level: i + 1,
        percentage: p,
        name: lvl.name || `Level ${i + 1}`,
      });
    }

    if (sum > 100) {
      throw new ApiError(400, `Sum of MLM level percentages cannot exceed 100% (currently ${sum}%)`, ERROR_CODES.BAD_REQUEST);
    }

    const mlmValue = { maxLevels: 9, levels: cleanLevels };
    await Settings.findOneAndUpdate(
      { key: 'MLM_COMMISSION_RATES' },
      { value: mlmValue, category: 'MLM', updatedBy: req.user._id },
      { upsert: true, new: true }
    );
    await Settings.findOneAndUpdate(
      { key: 'MLM_CONFIG' },
      { value: mlmValue, category: 'MLM', updatedBy: req.user._id },
      { upsert: true, new: true }
    );
  }

  await logAdminAction(
    req,
    'COMMISSION_SETTINGS_UPDATE',
    'Settings',
    'COMMISSIONS',
    { note: 'Updated platform and 9-level MLM commission distribution rules' }
  );

  return res.status(200).json(
    new ApiResponse(200, { success: true }, 'Commission settings updated successfully')
  );
});

// ==========================================
// 10. SUBSCRIPTION PLANS MANAGEMENT
// ==========================================
export const getSubscriptionPlans = asyncWrapper(async (req, res) => {
  const [vendorPlans, customerPlans] = await Promise.all([
    SubscriptionPlan.find().sort({ displayOrder: 1, createdAt: -1 }),
    CustomerSubscriptionPlan.find().sort({ price: 1, createdAt: -1 }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      { vendorPlans, customerPlans },
      'Subscription plans retrieved successfully'
    )
  );
});

export const createSubscriptionPlan = asyncWrapper(async (req, res) => {
  const { planType, name, code, description, price, monthlyPrice, yearlyPrice, durationValue, durationUnit, features, coinsReward } = req.body;

  if (!planType || !['VENDOR', 'CUSTOMER'].includes(planType)) {
    throw new ApiError(400, 'planType must be VENDOR or CUSTOMER', ERROR_CODES.BAD_REQUEST);
  }

  if (!name || !code) {
    throw new ApiError(400, 'Name and code are required', ERROR_CODES.BAD_REQUEST);
  }

  const cleanCode = code.trim().toUpperCase();

  if (planType === 'VENDOR') {
    const existing = await SubscriptionPlan.findOne({ code: cleanCode });
    if (existing) throw new ApiError(400, `Vendor plan code '${cleanCode}' already exists`, ERROR_CODES.BAD_REQUEST);

    const mPrice = Number(monthlyPrice ?? price ?? 0);
    const yPrice = Number(yearlyPrice ?? (mPrice * 10));

    const newPlan = await SubscriptionPlan.create({
      name: name.trim(),
      code: cleanCode,
      description: description || '',
      monthlyPrice: mPrice,
      yearlyPrice: yPrice,
      applicableEntityType: 'VENDOR',
      features: Array.isArray(features) ? features : (typeof features === 'string' ? features.split('\n').filter(Boolean) : []),
      isActive: true,
    });

    await logAdminAction(req, 'VENDOR_PLAN_CREATE', 'SubscriptionPlan', newPlan._id, { code: cleanCode, price: mPrice });
    return res.status(201).json(new ApiResponse(201, newPlan, 'Vendor subscription plan created successfully'));
  } else {
    const existing = await CustomerSubscriptionPlan.findOne({ code: cleanCode });
    if (existing) throw new ApiError(400, `Customer plan code '${cleanCode}' already exists`, ERROR_CODES.BAD_REQUEST);

    const newPlan = await CustomerSubscriptionPlan.create({
      name: name.trim(),
      code: cleanCode,
      description: description || '',
      durationValue: Number(durationValue) || 1,
      durationUnit: durationUnit || 'MONTH',
      price: Number(price) || 0,
      rewardRules: {
        coinsOnSubscribe: Number(coinsReward) || 0,
      },
      status: 'ACTIVE',
    });

    await logAdminAction(req, 'CUSTOMER_PLAN_CREATE', 'CustomerSubscriptionPlan', newPlan._id, { code: cleanCode, price });
    return res.status(201).json(new ApiResponse(201, newPlan, 'Customer subscription plan created successfully'));
  }
});

export const updateSubscriptionPlan = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { planType, name, description, price, monthlyPrice, yearlyPrice, isActive, status, features, coinsReward } = req.body;

  if (planType === 'VENDOR') {
    const plan = await SubscriptionPlan.findById(id);
    if (!plan) throw new ApiError(404, 'Vendor plan not found', ERROR_CODES.NOT_FOUND);

    if (name) plan.name = name.trim();
    if (description !== undefined) plan.description = description;
    if (monthlyPrice !== undefined) plan.monthlyPrice = Number(monthlyPrice);
    if (yearlyPrice !== undefined) plan.yearlyPrice = Number(yearlyPrice);
    if (isActive !== undefined) plan.isActive = Boolean(isActive);
    if (features !== undefined) {
      plan.features = Array.isArray(features) ? features : (typeof features === 'string' ? features.split('\n').filter(Boolean) : []);
    }

    await plan.save();
    await logAdminAction(req, 'VENDOR_PLAN_UPDATE', 'SubscriptionPlan', plan._id, { name: plan.name });
    return res.status(200).json(new ApiResponse(200, plan, 'Vendor subscription plan updated successfully'));
  } else {
    const plan = await CustomerSubscriptionPlan.findById(id);
    if (!plan) throw new ApiError(404, 'Customer plan not found', ERROR_CODES.NOT_FOUND);

    if (name) plan.name = name.trim();
    if (description !== undefined) plan.description = description;
    if (price !== undefined) plan.price = Number(price);
    if (status) plan.status = status;
    if (coinsReward !== undefined) plan.rewardRules.coinsOnSubscribe = Number(coinsReward);

    await plan.save();
    await logAdminAction(req, 'CUSTOMER_PLAN_UPDATE', 'CustomerSubscriptionPlan', plan._id, { name: plan.name });
    return res.status(200).json(new ApiResponse(200, plan, 'Customer subscription plan updated successfully'));
  }
});

export const deleteSubscriptionPlan = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { planType } = req.query;

  if (planType === 'VENDOR') {
    const plan = await SubscriptionPlan.findById(id);
    if (!plan) throw new ApiError(404, 'Vendor plan not found', ERROR_CODES.NOT_FOUND);
    plan.isActive = !plan.isActive;
    await plan.save();
    await logAdminAction(req, 'VENDOR_PLAN_TOGGLE', 'SubscriptionPlan', plan._id, { isActive: plan.isActive });
    return res.status(200).json(new ApiResponse(200, plan, `Vendor plan ${plan.isActive ? 'activated' : 'deactivated'}`));
  } else {
    const plan = await CustomerSubscriptionPlan.findById(id);
    if (!plan) throw new ApiError(404, 'Customer plan not found', ERROR_CODES.NOT_FOUND);
    plan.status = plan.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await plan.save();
    await logAdminAction(req, 'CUSTOMER_PLAN_TOGGLE', 'CustomerSubscriptionPlan', plan._id, { status: plan.status });
    return res.status(200).json(new ApiResponse(200, plan, `Customer plan ${plan.status}`));
  }
});

// ==========================================
// 11. VENDOR PAYOUT & WITHDRAWAL APPROVALS
// ==========================================
export const getPayoutRequests = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 20, status = '' } = req.query;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (status) query.status = status;

  const [payouts, total, statsAgg] = await Promise.all([
    VendorWithdrawal.find(query)
      .populate({
        path: 'vendorId',
        select: 'storeName balance pendingBalance totalSales kycStatus userId',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    VendorWithdrawal.countDocuments(query),
    VendorWithdrawal.aggregate([
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const summary = statsAgg.reduce((acc, curr) => {
    acc[curr._id] = { count: curr.count, amount: curr.totalAmount };
    return acc;
  }, {});

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        payouts,
        summary,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
      'Payout requests retrieved successfully'
    )
  );
});

export const approvePayoutRequest = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { adminNotes } = req.body;

  const withdrawal = await VendorWithdrawal.findById(id);
  if (!withdrawal) throw new ApiError(404, 'Withdrawal request not found', ERROR_CODES.NOT_FOUND);

  if (withdrawal.status !== 'PENDING') {
    throw new ApiError(400, `Withdrawal request is already ${withdrawal.status}`, ERROR_CODES.BAD_REQUEST);
  }

  const vendor = await Vendor.findById(withdrawal.vendorId);
  if (!vendor) throw new ApiError(404, 'Associated vendor profile not found', ERROR_CODES.NOT_FOUND);

  // 1. Reconcile Vendor Pending Balance
  vendor.pendingBalance = Math.max(0, (vendor.pendingBalance || 0) - withdrawal.amount);
  await vendor.save();

  // 2. Record in immutable VendorLedger as PAYOUT (confirmation of settlement)
  await VendorLedger.create({
    vendorId: vendor._id,
    transactionType: 'PAYOUT',
    credit: 0,
    debit: 0, // Available balance was already debited during reservation
    balanceSnapshot: vendor.balance,
    description: `Payout approved & disbursed by Super Admin (${adminNotes || 'Direct Bank/UPI Settlement'})`,
    referenceId: withdrawal._id.toString(),
  });

  // 3. Record in PlatformLedger as WITHDRAWAL disbursement
  try {
    const latestPlatform = await PlatformLedger.findOne().sort({ createdAt: -1 });
    const currentBal = latestPlatform?.balanceSnapshot || 0;
    const nextBal = currentBal - withdrawal.amount;

    await PlatformLedger.create({
      transactionId: `PL-PAYOUT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'WITHDRAWAL',
      sourceEntityType: 'WITHDRAWAL',
      sourceEntityId: withdrawal._id.toString(),
      credit: 0,
      debit: withdrawal.amount,
      balanceSnapshot: nextBal,
      description: `Vendor payout disbursement for ${vendor.storeName}`,
      metadata: {
        vendorId: vendor._id,
        amount: withdrawal.amount,
        approvedBy: req.user._id,
      },
    });
  } catch (ledgerErr) {
    console.error('Failed to log platform withdrawal ledger:', ledgerErr);
  }

  // 4. Update withdrawal record
  withdrawal.status = 'APPROVED';
  withdrawal.adminNotes = adminNotes || 'Approved by Super Admin';
  withdrawal.processedAt = new Date();
  await withdrawal.save();

  // 5. Notify Vendor
  try {
    if (vendor.userId) {
      await notificationService.createNotification({
        userId: vendor.userId,
        title: 'Payout Request Approved',
        message: `Your withdrawal of ₹${withdrawal.amount.toLocaleString('en-IN')} has been approved and processed.`,
        type: 'PAYOUT_PROCESSED',
        link: '/vendor/wallet',
      });
    }
  } catch (notifErr) {
    console.error('Failed to send payout notification:', notifErr);
  }

  await logAdminAction(
    req,
    'VENDOR_PAYOUT_APPROVED',
    'VendorWithdrawal',
    withdrawal._id,
    { amount: withdrawal.amount, vendor: vendor.storeName }
  );

  return res.status(200).json(
    new ApiResponse(200, { withdrawal }, 'Payout request approved and disbursed successfully')
  );
});

export const rejectPayoutRequest = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { adminNotes } = req.body;

  if (!adminNotes || !adminNotes.trim()) {
    throw new ApiError(400, 'Reason for rejection is required', ERROR_CODES.BAD_REQUEST);
  }

  const withdrawal = await VendorWithdrawal.findById(id);
  if (!withdrawal) throw new ApiError(404, 'Withdrawal request not found', ERROR_CODES.NOT_FOUND);

  if (withdrawal.status !== 'PENDING') {
    throw new ApiError(400, `Withdrawal request is already ${withdrawal.status}`, ERROR_CODES.BAD_REQUEST);
  }

  const vendor = await Vendor.findById(withdrawal.vendorId);
  if (!vendor) throw new ApiError(404, 'Associated vendor profile not found', ERROR_CODES.NOT_FOUND);

  // Restore funds back to vendor available balance
  vendor.pendingBalance = Math.max(0, (vendor.pendingBalance || 0) - withdrawal.amount);
  vendor.balance = (vendor.balance || 0) + withdrawal.amount;
  await vendor.save();

  withdrawal.status = 'REJECTED';
  withdrawal.adminNotes = adminNotes.trim();
  withdrawal.processedAt = new Date();
  await withdrawal.save();

  try {
    if (vendor.userId) {
      await notificationService.createNotification({
        userId: vendor.userId,
        title: 'Payout Request Rejected',
        message: `Your withdrawal of ₹${withdrawal.amount.toLocaleString('en-IN')} was rejected. Reason: ${adminNotes.trim()}. Funds returned to your balance.`,
        type: 'PAYOUT_REJECTED',
        link: '/vendor/wallet',
      });
    }
  } catch (notifErr) {
    console.error('Failed to send payout rejection notification:', notifErr);
  }

  await logAdminAction(
    req,
    'VENDOR_PAYOUT_REJECTED',
    'VendorWithdrawal',
    withdrawal._id,
    { amount: withdrawal.amount, reason: adminNotes.trim() }
  );

  return res.status(200).json(
    new ApiResponse(200, { withdrawal }, 'Payout request rejected and funds returned to vendor')
  );
});

// ==========================================
// 12. DOUBLE-ENTRY FINANCIAL LEDGER AUDIT
// ==========================================
export const getFinancialLedger = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 20, type = '' } = req.query;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const platformQuery = {};
  if (type) platformQuery.type = type;

  const [platformLogs, totalPlatform, vendorLedgerRecent, ledgerStats] = await Promise.all([
    PlatformLedger.find(platformQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    PlatformLedger.countDocuments(platformQuery),
    VendorLedger.find()
      .populate('vendorId', 'storeName')
      .sort({ createdAt: -1 })
      .limit(10),
    PlatformLedger.aggregate([
      {
        $group: {
          _id: '$type',
          totalCredit: { $sum: '$credit' },
          totalDebit: { $sum: '$debit' },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const latestPlatform = await PlatformLedger.findOne().sort({ createdAt: -1 });
  const platformBalance = latestPlatform?.balanceSnapshot || 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        platformLogs,
        vendorLedgerRecent,
        ledgerStats,
        platformBalance,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalPlatform,
          pages: Math.ceil(totalPlatform / limitNum),
        },
      },
      'Double-entry financial ledger records retrieved successfully'
    )
  );
});

// ==========================================
// 13. FINANCIAL TRANSACTION EXPLORER
// ==========================================
export const getOrderFinancialLineage = asyncWrapper(async (req, res) => {
  const { orderId } = req.params;

  let order = null;
  if (mongoose.Types.ObjectId.isValid(orderId)) {
    order = await Order.findById(orderId);
  }
  if (!order) {
    order = await Order.findOne({ $or: [{ orderNumber: orderId }, { publicOrderId: orderId }] });
  }

  if (!order) {
    throw new ApiError(404, 'Order not found', ERROR_CODES.NOT_FOUND);
  }

  const { VendorOrder } = await import('../models/VendorOrder.js');
  const { VendorSettlement } = await import('../models/VendorSettlement.js');
  const { StockTransaction } = await import('../models/StockTransaction.js');
  const { CoinTransaction } = await import('../models/CoinTransaction.js');

  const [
    payments,
    suborders,
    commissions,
    vendorLedgers,
    platformLedgers,
    stockTxs,
    coinTxs,
  ] = await Promise.all([
    Payment.find({ orderId: order._id }).sort({ createdAt: 1 }),
    VendorOrder.find({ parentOrderId: order._id }).populate('vendorId', 'storeName slug balance'),
    Commission.find({ orderId: order._id }).populate('recipientUserId', 'name email role'),
    VendorLedger.find({ orderId: order._id }).populate('vendorId', 'storeName'),
    PlatformLedger.find({
      $or: [
        { sourceEntityId: order._id.toString() },
        { 'metadata.orderId': order._id },
        { 'metadata.orderId': order._id.toString() },
      ],
    }),
    StockTransaction.find({ orderId: order._id }).populate('productId', 'name sku'),
    CoinTransaction.find({ referenceId: order.orderNumber }),
  ]);

  const suborderIds = suborders.map((s) => s._id);
  const settlements = await VendorSettlement.find({ suborderId: { $in: suborderIds } }).populate('vendorId', 'storeName');

  const totalGross = suborders.reduce((acc, s) => acc + (s.subtotal || 0), 0);
  const totalPlatformFee = suborders.reduce((acc, s) => acc + (s.platformCommission || 0), 0);
  const totalVendorEarning = suborders.reduce((acc, s) => acc + (s.vendorEarning || 0), 0);
  const totalSettlementsPayable = settlements.reduce((acc, st) => acc + (st.netPayable || 0), 0);

  const doubleEntryBalanced = Math.abs(totalGross - (totalPlatformFee + totalVendorEarning)) < 0.01;

  const lineage = {
    order: {
      id: order._id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      grandTotal: order.grandTotal,
      subtotal: order.subtotal,
      fairCoinsUsed: order.fairCoinsUsed,
      createdAt: order.createdAt,
    },
    payments,
    vendorSuborders: suborders,
    commissions,
    vendorLedgerEntries: vendorLedgers,
    platformLedgerEntries: platformLedgers,
    vendorSettlements: settlements,
    stockMovements: stockTxs,
    coinMovements: coinTxs,
    reconciliation: {
      totalGross,
      totalPlatformFee,
      totalVendorEarning,
      totalSettlementsPayable,
      doubleEntryBalanced,
      status: doubleEntryBalanced ? 'MATCH' : 'MISMATCH',
    },
  };

  return res.status(200).json(
    new ApiResponse(200, lineage, 'Order financial lineage traced successfully')
  );
});

