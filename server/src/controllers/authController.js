import { authService } from '../services/authService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = asyncWrapper(async (req, res) => {
  const { user, tokens } = await authService.register(req.body);

  res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
  return res.status(201).json(
    new ApiResponse(
      201,
      { user, accessToken: tokens.accessToken },
      'User registered successfully'
    )
  );
});

export const login = asyncWrapper(async (req, res) => {
  const result = await authService.login(req.body);

  if (result.mfaRequired) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          mfaRequired: true,
          mfaToken: result.mfaToken,
          user: result.user,
        },
        'Two-factor authentication code required'
      )
    );
  }

  const { user, tokens } = result;
  res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
  return res.status(200).json(
    new ApiResponse(
      200,
      { user, accessToken: tokens.accessToken },
      'Login successful'
    )
  );
});

export const refreshToken = asyncWrapper(async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  const { user, tokens } = await authService.refreshTokens(token);

  res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
  return res.status(200).json(
    new ApiResponse(
      200,
      { accessToken: tokens.accessToken, user },
      'Token refreshed successfully'
    )
  );
});

export const logout = asyncWrapper(async (req, res) => {
  if (req.user) {
    await authService.logout(req.user._id);
  }
  res.clearCookie('refreshToken', COOKIE_OPTIONS);
  return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

export const getMe = asyncWrapper(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, { user: req.user }, 'User profile retrieved'));
});
