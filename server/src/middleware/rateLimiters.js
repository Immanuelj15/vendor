import rateLimit from 'express-rate-limit';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
    errorCode: ERROR_CODES.BAD_REQUEST,
  },
});

export const mutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Too many state mutation requests, please try again after 15 minutes',
    errorCode: ERROR_CODES.BAD_REQUEST,
  },
});
