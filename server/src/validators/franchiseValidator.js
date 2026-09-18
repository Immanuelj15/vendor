import { z } from 'zod';

export const createTerritorySchema = z.object({
  type: z.enum(['STATE', 'DISTRICT', 'TALUK']),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters'),
  parentTerritory: z.string().optional().nullable(),
  state: z.string().optional(),
  district: z.string().optional(),
  taluk: z.string().optional(),
  pincodes: z.array(z.string()).optional(),
});

export const createFranchiseSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  franchiseType: z.enum(['STATE', 'DISTRICT', 'TALUK']),
  territoryId: z.string().min(1, 'Territory ID is required'),
  parentFranchiseId: z.string().optional().nullable(),
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone must be at least 10 characters'),
  email: z.string().email('Invalid email address'),
  address: z.string().optional(),
});

export const createShopkeeperSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  talukFranchiseId: z.string().min(1, 'Taluk Franchise ID is required'),
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone must be at least 10 characters'),
  email: z.string().email('Invalid email address'),
});

export const createShopSchema = z.object({
  shopkeeperId: z.string().min(1, 'Shopkeeper ID is required'),
  talukFranchiseId: z.string().min(1, 'Taluk Franchise ID is required'),
  shopName: z.string().min(2, 'Shop name must be at least 2 characters'),
  address: z.string().min(5, 'Address is required'),
  state: z.string().min(2, 'State is required'),
  district: z.string().min(2, 'District is required'),
  taluk: z.string().min(2, 'Taluk is required'),
  pincode: z.string().min(6, 'Pincode is required'),
  phone: z.string().min(10, 'Phone is required'),
  email: z.string().email('Invalid email address'),
});

export const submitKycSchema = z.object({
  entityType: z.enum(['FRANCHISE', 'SHOPKEEPER', 'SHOP']),
  entityId: z.string().min(1, 'Entity ID is required'),
  documentType: z.enum(['PAN', 'AADHAAR', 'GST', 'TRADE_LICENSE']),
  documentNumber: z.string().min(5, 'Document number is required'),
  documentUrl: z.string().url('Invalid document URL'),
});

export const reviewKycSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  rejectionReason: z.string().optional(),
});

export const createSubscriptionPlanSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  code: z.string().min(2, 'Code is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  durationDays: z.number().min(1, 'Duration must be at least 1 day'),
  applicableEntityType: z.enum(['FRANCHISE', 'SHOPKEEPER', 'SHOP']),
  features: z.array(z.string()).optional(),
});

export const updateFranchiseStatusSchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED', 'EXPIRED', 'TERMINATED']),
  notes: z.string().optional(),
});
