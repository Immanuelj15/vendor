import crypto from 'crypto';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { logAdminAction } from './auditLogService.js';

/**
 * Pre-hashes token with SHA-256 to eliminate bcrypt 72-byte truncation
 * ensuring the full cryptographic length of JWTs is verified.
 */
function hashTokenForStorage(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export const tokenService = {
  async generateTokens(user) {
    // Minimal required claims: { id, role } as mandated by Section 19
    const payload = {
      id: user._id,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    // Refresh token includes unique jti nonce to ensure rotation uniqueness
    const refreshToken = generateRefreshToken({ ...payload, jti: crypto.randomUUID() });

    // Store pre-hashed + bcrypt-hashed refresh token in database for security
    const tokenDigest = hashTokenForStorage(refreshToken);
    const refreshTokenHash = await bcrypt.hash(tokenDigest, 10);
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    return { accessToken, refreshToken };
  },

  async verifyAndRotateRefreshToken(token) {
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select('+refreshTokenHash +lastRotatedTokenHash');

    if (!user) {
      throw new Error('User not found');
    }

    const tokenDigest = hashTokenForStorage(token);

    // Check if token matches active refresh token
    if (user.refreshTokenHash) {
      const isMatch = await bcrypt.compare(tokenDigest, user.refreshTokenHash);
      if (isMatch) {
        // Valid rotation: track last rotated token for family reuse detection
        user.lastRotatedTokenHash = user.refreshTokenHash;
        return user;
      }
    }

    // Check if token matches previously rotated token -> TOKEN REUSE DETECTED!
    if (user.lastRotatedTokenHash) {
      const isReused = await bcrypt.compare(tokenDigest, user.lastRotatedTokenHash);
      if (isReused) {
        // Invalidate entire token family immediately
        user.refreshTokenHash = null;
        user.lastRotatedTokenHash = null;
        await user.save();

        await logAdminAction({
          userId: user._id,
          action: 'REFRESH_TOKEN_REUSE_DETECTED',
          entity: 'User',
          entityId: String(user._id),
          oldValue: null,
          newValue: { reason: 'Stolen or reused refresh token submitted, session family revoked' },
        });

        throw new Error('Refresh token reuse detected. Session terminated for security.');
      }
    }

    throw new Error('Refresh token revoked or invalid');
  },

  async revokeRefreshToken(userId) {
    await User.findByIdAndUpdate(userId, {
      refreshTokenHash: null,
      lastRotatedTokenHash: null,
    });
  },
};

export default tokenService;
