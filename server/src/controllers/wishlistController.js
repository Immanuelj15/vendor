import { Wishlist } from '../models/Wishlist.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const getWishlist = asyncWrapper(async (req, res) => {
  let wishlist = await Wishlist.findOne({ userId: req.user._id }).populate('products');
  if (!wishlist) {
    wishlist = await Wishlist.create({ userId: req.user._id, products: [] });
  }
  return res.status(200).json(new ApiResponse(200, { wishlist }, 'Wishlist retrieved'));
});

export const toggleWishlistProduct = asyncWrapper(async (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    throw new ApiError(400, 'Product ID is required', ERROR_CODES.BAD_REQUEST);
  }

  let wishlist = await Wishlist.findOne({ userId: req.user._id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ userId: req.user._id, products: [] });
  }

  const index = wishlist.products.indexOf(productId);
  let message = '';
  if (index > -1) {
    wishlist.products.splice(index, 1);
    message = 'Product removed from wishlist';
  } else {
    wishlist.products.push(productId);
    message = 'Product added to wishlist';
  }

  await wishlist.save();
  const updatedWishlist = await Wishlist.findOne({ userId: req.user._id }).populate('products');

  return res.status(200).json(new ApiResponse(200, { wishlist: updatedWishlist }, message));
});
