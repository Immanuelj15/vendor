import { User } from '../models/User.js';
import { AdminRole } from '../models/AdminRole.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import bcrypt from 'bcryptjs';

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

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(400, 'Email already exists', ERROR_CODES.CONFLICT);

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const roleStr = isSuperAdmin ? 'SUPER_ADMIN' : 'ADMIN';

  const user = await User.create({
    name,
    email,
    phone,
    passwordHash,
    role: roleStr,
    adminRoleId: isSuperAdmin ? null : adminRoleId
  });

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
