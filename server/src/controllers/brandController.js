import { Brand } from '../models/Brand.js';
import { Product } from '../models/Product.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { brandInputSchema } from '../utils/validators.js';

export const getBrands = asyncWrapper(async (req, res) => {
  const { search, active, page = 1, limit = 20 } = req.query;
  const query = {};

  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }
  if (active !== undefined) {
    query.isActive = active === 'true' || active === true;
  }

  const parsedPage = Math.max(1, parseInt(page) || 1);
  const parsedLimit = Math.max(1, parseInt(limit) || 20);
  const skip = (parsedPage - 1) * parsedLimit;

  const brands = await Brand.find(query).sort({ name: 1 }).skip(skip).limit(parsedLimit);
  const total = await Brand.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(
      200,
      { brands, total, page: parsedPage, pages: Math.ceil(total / parsedLimit) },
      'Brands retrieved'
    )
  );
});

export const createBrand = asyncWrapper(async (req, res) => {
  const validated = brandInputSchema.parse(req.body);
  
  const slug = (validated.slug || validated.name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const existing = await Brand.findOne({ slug });
  if (existing) {
    throw new ApiError(400, 'Brand slug already exists', ERROR_CODES.BAD_REQUEST);
  }

  const brand = await Brand.create({ ...validated, slug });
  return res.status(201).json(new ApiResponse(201, { brand }, 'Brand created successfully'));
});

export const updateBrand = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const validated = brandInputSchema.partial().parse(req.body);

  const brand = await Brand.findByIdAndUpdate(id, validated, { new: true });
  if (!brand) {
    throw new ApiError(404, 'Brand not found', ERROR_CODES.NOT_FOUND);
  }
  return res.status(200).json(new ApiResponse(200, { brand }, 'Brand updated successfully'));
});

export const deleteBrand = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  // Prevent deletion if any product links to it
  const count = await Product.countDocuments({ brandId: id });
  if (count > 0) {
    throw new ApiError(400, 'Cannot delete brand. Products depend on this brand.', ERROR_CODES.BAD_REQUEST);
  }

  const brand = await Brand.findByIdAndDelete(id);
  if (!brand) {
    throw new ApiError(404, 'Brand not found', ERROR_CODES.NOT_FOUND);
  }

  return res.status(200).json(new ApiResponse(200, null, 'Brand deleted successfully'));
});
