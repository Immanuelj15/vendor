import { User } from '../models/User.js';
import { AdminRole } from '../models/AdminRole.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import bcrypt from 'bcryptjs';

import { AdminProfile } from '../models/AdminProfile.js';
import { SuperAdminProfile } from '../models/SuperAdminProfile.js';
import { logAdminAction } from '../services/auditLogService.js';

// --- Roles ---
export const getRoles = asyncWrapper(async (req, res) => {
  const roles = await AdminRole.find().sort({ name: 1 });
  return res.status(200).json(new ApiResponse(200, { roles }, 'Admin roles retrieved'));
});

export const createRole = asyncWrapper(async (req, res) => {
  const { name, description, permissions } = req.body;
  const role = await AdminRole.create({ name: name.toUpperCase(), description, permissions });
  return res.status(201).json(new ApiResponse(201, { role }, 'Admin role created'));
});

export const updateRole = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { name, description, permissions, isActive } = req.body;
  
  const role = await AdminRole.findById(id);
  if (!role) throw new ApiError(404, 'Role not found', ERROR_CODES.NOT_FOUND);

  if (name) role.name = name.toUpperCase();
  if (description !== undefined) role.description = description;
  if (permissions) role.permissions = permissions;
  if (isActive !== undefined) role.isActive = isActive;

  await role.save();
  return res.status(200).json(new ApiResponse(200, { role }, 'Admin role updated'));
});

// --- Admins ---
export const getAdmins = asyncWrapper(async (req, res) => {
  const admins = await User.find({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] } })
    .populate('adminRoleId')
    .select('-passwordHash')
    .sort({ createdAt: -1 });
  
  return res.status(200).json(new ApiResponse(200, { admins }, 'Admins retrieved'));
});

export const createAdmin = asyncWrapper(async (req, res) => {
  const { name, email, phone, password, adminRoleId, isSuperAdmin } = req.body;

  if (isSuperAdmin && req.user.role !== 'SUPER_ADMIN') {
    throw new ApiError(403, 'Only Super Admin can provision Super Admin accounts', ERROR_CODES.FORBIDDEN);
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) throw new ApiError(400, 'Email already exists', ERROR_CODES.CONFLICT);

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const roleStr = (isSuperAdmin && req.user.role === 'SUPER_ADMIN') ? 'SUPER_ADMIN' : 'ADMIN';

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone ? phone.trim() : undefined,
    passwordHash,
    role: roleStr,
    adminRoleId: roleStr === 'SUPER_ADMIN' ? null : adminRoleId || null
  });

  const parts = name.trim().split(' ');
  const firstName = parts[0] || '';
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';

  if (roleStr === 'ADMIN') {
    await AdminProfile.create({
      userId: user._id,
      firstName,
      lastName,
      createdBy: req.user._id,
    });
    await logAdminAction({
      userId: req.user._id,
      action: 'ADMIN_CREATED',
      entity: 'User',
      entityId: String(user._id),
      oldValue: null,
      newValue: { name: user.name, email: user.email, role: user.role },
      ipAddress: req.ip,
    });
  } else {
    await SuperAdminProfile.create({
      userId: user._id,
      firstName,
      lastName,
    });
  }

  const responseUser = user.toObject();
  delete responseUser.passwordHash;

  return res.status(201).json(new ApiResponse(201, { admin: responseUser }, 'Admin created'));
});

export const updateAdmin = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { name, phone, adminRoleId, status } = req.body;

  const admin = await User.findOne({ _id: id, role: { $in: ['ADMIN', 'SUPER_ADMIN'] } });
  if (!admin) throw new ApiError(404, 'Admin not found', ERROR_CODES.NOT_FOUND);

  if (name) admin.name = name;
  if (phone !== undefined) admin.phone = phone;
  if (adminRoleId !== undefined && admin.role === 'ADMIN') admin.adminRoleId = adminRoleId;
  if (status) admin.status = status;

  await admin.save();
  
  const responseAdmin = admin.toObject();
  delete responseAdmin.passwordHash;

  return res.status(200).json(new ApiResponse(200, { admin: responseAdmin }, 'Admin updated'));
});
