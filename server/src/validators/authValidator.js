import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional().nullable().or(z.literal('')),
  referralCode: z.string().optional().nullable().or(z.literal('')),
  shopQrToken: z.string().optional().nullable().or(z.literal('')),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  portal: z.enum(['CUSTOMER', 'VENDOR', 'ADMIN', 'SUPER_ADMIN']).optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});
