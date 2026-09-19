import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { generateSecret, verify: verifyTOTP, generateURI } = require('otplib');
import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import { ROLES } from '../constants/roles.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { encryptSecret, decryptSecret, hashRecoveryCode, generateRecoveryCodes } from '../utils/cryptoUtils.js';
import { tokenService } from '../services/tokenService.js';
import { logAdminAction } from '../services/auditLogService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fairkart_jwt_secret_key_prod_2026';

function resolveMfaUser(req) {
  if (req.user) {
    return req.user;
  }
  const token = req.body.mfaToken || req.headers['x-mfa-token'];
  if (!token) {
    throw new ApiError(401, 'MFA session token is required', ERROR_CODES.UNAUTHORIZED);
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'MFA_PENDING') {
      throw new ApiError(401, 'Invalid token scope for MFA operation', ERROR_CODES.UNAUTHORIZED);
    }
    return decoded;
  } catch (err) {
    throw new ApiError(401, 'MFA session expired or invalid', ERROR_CODES.UNAUTHORIZED);
  }
}

/**
 * 1. Setup MFA: Generates secret & QR code data URL
 */
export const setupMFA = asyncWrapper(async (req, res) => {
  const tokenUser = resolveMfaUser(req);
  const user = await User.findById(tokenUser.id || tokenUser._id);
  if (!user) throw new ApiError(404, 'User not found', ERROR_CODES.NOT_FOUND);

  if (user.role !== ROLES.SUPER_ADMIN) {
    throw new ApiError(403, 'MFA setup is restricted to Super Admin accounts', ERROR_CODES.FORBIDDEN);
  }

  const secret = generateSecret();
  const uri = generateURI({ secret, label: user.email, issuer: 'FairKart' });
  const qrCodeDataUrl = await QRCode.toDataURL(uri);

  // Store secret encrypted at rest temporarily until confirmed
  user.mfaSecret = encryptSecret(secret);
  await user.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        qrCode: qrCodeDataUrl,
        secret, // for manual entry
      },
      'MFA enrollment initiated. Scan QR code or enter secret into authenticator app.'
    )
  );
});

/**
 * 2. Enable MFA: Verifies first code & generates recovery codes
 */
export const enableMFA = asyncWrapper(async (req, res) => {
  const tokenUser = resolveMfaUser(req);
  const { totpCode } = req.body;

  if (!totpCode) {
    throw new ApiError(400, '6-digit verification code is required', ERROR_CODES.BAD_REQUEST);
  }

  const user = await User.findById(tokenUser.id || tokenUser._id).select('+mfaSecret');
  if (!user) throw new ApiError(404, 'User not found', ERROR_CODES.NOT_FOUND);

  if (user.role !== ROLES.SUPER_ADMIN) {
    throw new ApiError(403, 'Forbidden: Only Super Admins may enable MFA', ERROR_CODES.FORBIDDEN);
  }

  const plainSecret = decryptSecret(user.mfaSecret);
  if (!plainSecret) {
    throw new ApiError(400, 'MFA setup has not been initiated. Please run setup first.', ERROR_CODES.BAD_REQUEST);
  }

  const verifyResult = await verifyTOTP({ token: String(totpCode).trim(), secret: plainSecret });
  if (!verifyResult || !verifyResult.valid) {
    await logAdminAction(user._id, 'MFA_VERIFICATION_FAILED', 'User', user._id, { reason: 'Initial enrollment code failed' });
    throw new ApiError(400, 'Invalid verification code. Please check your authenticator app and try again.', ERROR_CODES.BAD_REQUEST);
  }

  const recoveryCodes = generateRecoveryCodes(8);
  user.mfaRecoveryCodes = recoveryCodes.map(code => ({
    codeHash: hashRecoveryCode(code),
    used: false,
    usedAt: null
  }));
  user.mfaEnabled = true;
  user.mfaVerifiedAt = new Date();
  user.mfaFailedAttempts = 0;
  user.mfaLockedUntil = null;
  user.lastLoginAt = new Date();
  await user.save();

  await logAdminAction(user._id, 'MFA_ENABLED', 'User', user._id, { recoveryCodesGenerated: recoveryCodes.length });

  const tokens = await tokenService.generateTokens(user);
  const userObj = user.toObject();
  delete userObj.passwordHash;
  delete userObj.mfaSecret;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: userObj,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        recoveryCodes, // Displayed once for safe keeping
      },
      'MFA successfully enabled for Super Admin account'
    )
  );
});

/**
 * 3. Verify MFA during login
 */
export const verifyMFA = asyncWrapper(async (req, res) => {
  const { mfaToken, totpCode } = req.body;
  if (!mfaToken || !totpCode) {
    throw new ApiError(400, 'mfaToken and totpCode are required', ERROR_CODES.BAD_REQUEST);
  }

  let decoded;
  try {
    decoded = jwt.verify(mfaToken, JWT_SECRET);
    if (decoded.type !== 'MFA_PENDING') {
      throw new ApiError(401, 'Invalid MFA token scope', ERROR_CODES.UNAUTHORIZED);
    }
  } catch (err) {
    throw new ApiError(401, 'MFA verification session expired. Please log in again.', ERROR_CODES.UNAUTHORIZED);
  }

  const user = await User.findById(decoded.id).select('+mfaSecret');
  if (!user) throw new ApiError(404, 'User not found', ERROR_CODES.NOT_FOUND);

  if (user.role !== ROLES.SUPER_ADMIN) {
    throw new ApiError(403, 'Access denied', ERROR_CODES.FORBIDDEN);
  }

  // Rate Limiting / Lockout Check
  if (user.mfaLockedUntil && user.mfaLockedUntil > new Date()) {
    const minutes = Math.ceil((user.mfaLockedUntil - Date.now()) / 60000);
    throw new ApiError(429, `Account temporarily locked due to repeated failed MFA attempts. Try again in ${minutes} minutes.`, ERROR_CODES.FORBIDDEN);
  }

  const plainSecret = decryptSecret(user.mfaSecret);
  if (!plainSecret || !user.mfaEnabled) {
    throw new ApiError(400, 'MFA is not enabled on this account', ERROR_CODES.BAD_REQUEST);
  }

  const verifyResult = await verifyTOTP({ token: String(totpCode).trim(), secret: plainSecret });
  if (!verifyResult || !verifyResult.valid) {
    user.mfaFailedAttempts = (user.mfaFailedAttempts || 0) + 1;
    if (user.mfaFailedAttempts >= 5) {
      user.mfaLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lockout
    }
    await user.save();
    await logAdminAction(user._id, 'MFA_VERIFICATION_FAILED', 'User', user._id, { attempts: user.mfaFailedAttempts });
    throw new ApiError(401, 'Invalid verification code', ERROR_CODES.UNAUTHORIZED);
  }

  // Reset lockouts on success
  user.mfaFailedAttempts = 0;
  user.mfaLockedUntil = null;
  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await tokenService.generateTokens(user);
  const userObj = user.toObject();
  delete userObj.passwordHash;
  delete userObj.mfaSecret;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: userObj,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      'MFA verification successful. Super Admin authenticated.'
    )
  );
});

/**
 * 4. Verify Recovery Code Fallback
 */
export const verifyRecoveryCode = asyncWrapper(async (req, res) => {
  const { mfaToken, recoveryCode } = req.body;
  if (!mfaToken || !recoveryCode) {
    throw new ApiError(400, 'mfaToken and recoveryCode are required', ERROR_CODES.BAD_REQUEST);
  }

  let decoded;
  try {
    decoded = jwt.verify(mfaToken, JWT_SECRET);
    if (decoded.type !== 'MFA_PENDING') {
      throw new ApiError(401, 'Invalid MFA token scope', ERROR_CODES.UNAUTHORIZED);
    }
  } catch (err) {
    throw new ApiError(401, 'MFA session expired', ERROR_CODES.UNAUTHORIZED);
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(404, 'User not found', ERROR_CODES.NOT_FOUND);

  const hashedInput = hashRecoveryCode(recoveryCode);
  const matchedCode = user.mfaRecoveryCodes.find(c => c.codeHash === hashedInput && !c.used);

  if (!matchedCode) {
    user.mfaFailedAttempts = (user.mfaFailedAttempts || 0) + 1;
    if (user.mfaFailedAttempts >= 5) {
      user.mfaLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    await user.save();
    await logAdminAction(user._id, 'MFA_VERIFICATION_FAILED', 'User', user._id, { reason: 'Invalid or already used recovery code' });
    throw new ApiError(401, 'Invalid or already used recovery code', ERROR_CODES.UNAUTHORIZED);
  }

  matchedCode.used = true;
  matchedCode.usedAt = new Date();
  user.mfaFailedAttempts = 0;
  user.mfaLockedUntil = null;
  user.lastLoginAt = new Date();
  await user.save();

  await logAdminAction(user._id, 'MFA_RECOVERY_USED', 'User', user._id, { remainingCodes: user.mfaRecoveryCodes.filter(c => !c.used).length });

  const tokens = await tokenService.generateTokens(user);
  const userObj = user.toObject();
  delete userObj.passwordHash;
  delete userObj.mfaSecret;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: userObj,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      'Recovery code verified. Super Admin authenticated.'
    )
  );
});

/**
 * 5. Disable MFA
 */
export const disableMFA = asyncWrapper(async (req, res) => {
  const { currentPassword, totpCode } = req.body;
  const user = await User.findById(req.user._id).select('+passwordHash +mfaSecret');
  if (!user) throw new ApiError(404, 'User not found', ERROR_CODES.NOT_FOUND);

  if (user.role !== ROLES.SUPER_ADMIN) {
    throw new ApiError(403, 'Forbidden', ERROR_CODES.FORBIDDEN);
  }

  const isPasswordMatch = await user.comparePassword(currentPassword);
  if (!isPasswordMatch) {
    throw new ApiError(401, 'Invalid current password', ERROR_CODES.UNAUTHORIZED);
  }

  const plainSecret = decryptSecret(user.mfaSecret);
  const verifyResult = await verifyTOTP({ token: String(totpCode).trim(), secret: plainSecret });
  if (!verifyResult || !verifyResult.valid) {
    throw new ApiError(401, 'Invalid TOTP code', ERROR_CODES.UNAUTHORIZED);
  }

  user.mfaEnabled = false;
  user.mfaSecret = null;
  user.mfaRecoveryCodes = [];
  user.mfaVerifiedAt = null;
  await user.save();

  await logAdminAction(user._id, 'MFA_DISABLED', 'User', user._id, {});

  return res.status(200).json(new ApiResponse(200, null, 'MFA disabled successfully'));
});
