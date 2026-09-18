import { cartService } from '../services/cartService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

export const getCart = asyncWrapper(async (req, res) => {
  const cart = await cartService.getCart(req.user._id);
  return res.status(200).json(new ApiResponse(200, { cart }, 'Cart retrieved'));
});

export const addToCart = asyncWrapper(async (req, res) => {
  const cart = await cartService.addToCart(req.user._id, req.body);
  return res.status(200).json(new ApiResponse(200, { cart }, 'Item added to cart'));
});

export const updateQuantity = asyncWrapper(async (req, res) => {
  const cart = await cartService.updateQuantity(req.user._id, req.body);
  return res.status(200).json(new ApiResponse(200, { cart }, 'Cart item quantity updated'));
});

export const applyCoupon = asyncWrapper(async (req, res) => {
  const cart = await cartService.applyCoupon(req.user._id, req.body.code);
  return res.status(200).json(new ApiResponse(200, { cart }, 'Coupon applied successfully'));
});
