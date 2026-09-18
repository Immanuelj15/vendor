import { Coupon } from '../models/Coupon.js';
import { Order } from '../models/Order.js';
import { couponService } from '../services/couponService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { couponInputSchema } from '../utils/validators.js';

export const validateCoupon = asyncWrapper(async (req, res) => {
  const { code, items } = req.body;
  const result = await couponService.validateCoupon({
    code,
    userId: req.user?._id,
    items,
  });
  return res.status(200).json(new ApiResponse(200, result, 'Coupon validated successfully'));
});

export const getAdminCoupons = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const parsedPage = Math.max(1, parseInt(page) || 1);
  const parsedLimit = Math.max(1, parseInt(limit) || 20);
  const skip = (parsedPage - 1) * parsedLimit;

  const coupons = await Coupon.find().sort({ createdAt: -1 }).skip(skip).limit(parsedLimit);
  const total = await Coupon.countDocuments();

  return res.status(200).json(
    new ApiResponse(
      200,
      { coupons, total, page: parsedPage, pages: Math.ceil(total / parsedLimit) },
      'Coupons retrieved'
    )
  );
});

export const getCouponById = asyncWrapper(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found', ERROR_CODES.NOT_FOUND);
  return res.status(200).json(new ApiResponse(200, { coupon }, 'Coupon details retrieved'));
});

export const createCoupon = asyncWrapper(async (req, res) => {
  const validated = couponInputSchema.parse(req.body);
  
  const existing = await Coupon.findOne({ code: validated.code });
  if (existing) {
    throw new ApiError(400, 'Coupon code already exists', ERROR_CODES.BAD_REQUEST);
  }

  const coupon = await Coupon.create(validated);
  return res.status(201).json(new ApiResponse(201, { coupon }, 'Coupon created successfully'));
});

export const updateCoupon = asyncWrapper(async (req, res) => {
  const validated = couponInputSchema.partial().parse(req.body);
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, validated, { new: true });
  if (!coupon) throw new ApiError(404, 'Coupon not found', ERROR_CODES.NOT_FOUND);
  return res.status(200).json(new ApiResponse(200, { coupon }, 'Coupon updated successfully'));
});

export const deleteCoupon = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const coupon = await Coupon.findById(id);
  if (!coupon) throw new ApiError(404, 'Coupon not found', ERROR_CODES.NOT_FOUND);

  // Soft delete check
  const orderCount = await Order.countDocuments({ couponCode: coupon.code });
  if (orderCount > 0) {
    coupon.isActive = false;
    await coupon.save();
    return res.status(200).json(new ApiResponse(200, { coupon }, 'Coupon deactivated (soft-deleted) as active order history depends on it.'));
  }

  await Coupon.findByIdAndDelete(id);
  return res.status(200).json(new ApiResponse(200, null, 'Coupon deleted successfully'));
});
