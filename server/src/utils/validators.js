import { z } from 'zod';

// MongoDB ObjectId regex check
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
export const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid MongoDB ObjectId');

// Product query validator
export const productQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  vendor: z.string().optional(),
  minPrice: z.preprocess((val) => (val !== undefined ? Number(val) : undefined), z.number().nonnegative().optional()),
  maxPrice: z.preprocess((val) => (val !== undefined ? Number(val) : undefined), z.number().nonnegative().optional()),
  rating: z.preprocess((val) => (val !== undefined ? Number(val) : undefined), z.number().min(1).max(5).optional()),
  availability: z.enum(['in_stock', 'out_of_stock', 'all']).optional().default('all'),
  sort: z.enum(['price_asc', 'price_desc', 'newest', 'rating', 'popular']).optional().default('newest'),
  page: z.preprocess((val) => (val !== undefined ? Number(val) : undefined), z.number().int().min(1).optional().default(1)),
  limit: z.preprocess((val) => (val !== undefined ? Number(val) : undefined), z.number().int().min(1).optional().default(12)),
});

// Review schema validator
export const reviewInputSchema = z.object({
  productId: objectIdSchema,
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().min(5, 'Review details must be at least 5 characters long').optional(),
  body: z.string().min(5, 'Review details must be at least 5 characters long').optional(),
  images: z.array(z.string().url()).optional(),
}).refine(data => data.comment || data.body, {
  message: "Either comment or body is required",
  path: ["comment"]
});

// Coupon schema validator
export const couponInputSchema = z.object({
  code: z.string().toUpperCase().min(3).max(20).trim(),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().positive(),
  minPurchase: z.number().nonnegative().optional().default(0),
  maxDiscount: z.number().nonnegative().optional().default(0),
  usageLimit: z.number().int().positive().optional().default(1000),
  perUserLimit: z.number().int().positive().optional().default(1),
  startDate: z.string().datetime().or(z.string().date()).optional().default(() => new Date().toISOString()),
  endDate: z.string().datetime().or(z.string().date()),
  applicableCategories: z.array(objectIdSchema).optional(),
  isActive: z.boolean().optional().default(true),
}).refine(data => {
  if (data.type === 'PERCENTAGE' && data.discountValue > 100) {
    return false;
  }
  return true;
}, {
  message: "Percentage discount cannot exceed 100%",
  path: ["discountValue"]
});

// Campaign schema validator
export const campaignInputSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().optional().default(''),
  multiplier: z.number().min(1).default(2),
  type: z.enum(['REFERRAL_BOOST', 'PURCHASE_BOOST']),
  startDate: z.string().datetime().or(z.string().date()).optional().default(() => new Date().toISOString()),
  endDate: z.string().datetime().or(z.string().date()),
  isActive: z.boolean().optional().default(true),
});

// Brand schema validator
export const brandInputSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  slug: z.string().toLowerCase().optional(),
  logo: z.string().optional().default(''),
  description: z.string().optional().default(''),
  isActive: z.boolean().optional().default(true),
});
