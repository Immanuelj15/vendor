import { Category } from '../models/Category.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

export const getCategories = asyncWrapper(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  return res.status(200).json(new ApiResponse(200, { categories }, 'Categories retrieved'));
});

export const createCategory = asyncWrapper(async (req, res) => {
  const { name, image, description } = req.body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const category = await Category.create({
    name,
    slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
    image,
    description,
  });

  return res.status(201).json(new ApiResponse(201, { category }, 'Category created'));
});
