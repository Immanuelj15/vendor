import { productService } from '../services/productService.js';
import { Product } from '../models/Product.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { productQuerySchema } from '../utils/validators.js';

export const getProducts = asyncWrapper(async (req, res) => {
  const validatedQuery = productQuerySchema.parse(req.query);
  const result = await productService.getProducts(validatedQuery);
  return res.status(200).json(new ApiResponse(200, result, 'Products retrieved'));
});

export const getProductBySlug = asyncWrapper(async (req, res) => {
  const product = await productService.getProductBySlug(req.params.slug);
  return res.status(200).json(new ApiResponse(200, { product }, 'Product details retrieved'));
});

export const getFeaturedProducts = asyncWrapper(async (req, res) => {
  const products = await Product.find({ isFeatured: true, status: 'APPROVED' })
    .populate('categoryId', 'name slug')
    .populate('brandId', 'name slug')
    .populate('vendorId', 'storeName slug logo')
    .limit(12);
  return res.status(200).json(new ApiResponse(200, { products }, 'Featured products retrieved'));
});

export const getNewArrivals = asyncWrapper(async (req, res) => {
  const products = await Product.find({ status: 'APPROVED' })
    .populate('categoryId', 'name slug')
    .populate('brandId', 'name slug')
    .populate('vendorId', 'storeName slug logo')
    .sort({ createdAt: -1 })
    .limit(12);
  return res.status(200).json(new ApiResponse(200, { products }, 'New arrivals retrieved'));
});

export const getBestSelling = asyncWrapper(async (req, res) => {
  const products = await Product.find({ status: 'APPROVED' })
    .populate('categoryId', 'name slug')
    .populate('brandId', 'name slug')
    .populate('vendorId', 'storeName slug logo')
    .sort({ reviewCount: -1 })
    .limit(12);
  return res.status(200).json(new ApiResponse(200, { products }, 'Best selling products retrieved'));
});

export const getTopRated = asyncWrapper(async (req, res) => {
  const products = await Product.find({ status: 'APPROVED' })
    .populate('categoryId', 'name slug')
    .populate('brandId', 'name slug')
    .populate('vendorId', 'storeName slug logo')
    .sort({ rating: -1 })
    .limit(12);
  return res.status(200).json(new ApiResponse(200, { products }, 'Top rated products retrieved'));
});
