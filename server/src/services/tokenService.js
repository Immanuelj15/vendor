import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

export const tokenService = {
  async generateTokens(user) {
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store hashed refresh token in database for security
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    return { accessToken, refreshToken };
  },

  async verifyAndRotateRefreshToken(token) {
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select('+refreshTokenHash');

    if (!user || !user.refreshTokenHash) {
      throw new Error('Invalid refresh token');
    }

    const isMatch = await bcrypt.compare(token, user.refreshTokenHash);
    if (!isMatch) {
      throw new Error('Refresh token revoked or invalid');
    }

    return user;
  },

  async revokeRefreshToken(userId) {
    await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
  },
};
