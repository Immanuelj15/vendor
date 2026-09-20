import { z } from 'zod';
import { 
  customerRegistrationSchema,
  vendorRegistrationSchema,
  adminCreationSchema,
  superAdminBootstrapSchema,
  vendorBankSchema,
  customerProfileSchema,
  vendorProfileSchema,
  adminProfileSchema,
  superAdminProfileSchema
} from './roleAuthValidators.js';

export const registerSchema = customerRegistrationSchema;

export const loginSchema = z.object({
  email: z.string().min(1, 'Email or mobile number is required').trim(),
  password: z.string().min(1, 'Password is required'),
  portal: z.enum(['CUSTOMER', 'VENDOR', 'ADMIN', 'SUPER_ADMIN']).optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

export {
  customerRegistrationSchema,
  vendorRegistrationSchema,
  adminCreationSchema,
  superAdminBootstrapSchema,
  vendorBankSchema,
  customerProfileSchema,
  vendorProfileSchema,
  adminProfileSchema,
  superAdminProfileSchema
};
