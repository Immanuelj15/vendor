import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Brand } from '../models/Brand.js';
import { Settings } from '../models/Settings.js';
import { ProductStatusHistory } from '../models/ProductStatusHistory.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const productService = {
  async getProducts({
    search,
    category,
    brand,
    vendor,
    minPrice,
    maxPrice,
    rating,
    availability,
    sort = 'newest',
    page = 1,
    limit = 12,
  } = {}) {
    const query = { status: 'APPROVED', isDeleted: false };

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } },
        { sku: searchRegex },
      ];
    }
    if (category) {
      const catObj = await Category.findOne({ slug: category });
      if (catObj) query.categoryId = catObj._id;
    }
    if (brand) {
      const brandObj = await Brand.findOne({ slug: brand });
      if (brandObj) query.brandId = brandObj._id;
    }
    if (vendor) {
      query.vendorId = vendor;
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (rating) {
      query.rating = { $gte: Number(rating) };
    }
    if (availability === 'in_stock') {
      query.stock = { $gt: 0 };
    } else if (availability === 'out_of_stock') {
      query.stock = { $lte: 0 };
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'price_asc') sortOptions = { price: 1 };
    if (sort === 'price_desc') sortOptions = { price: -1 };
    if (sort === 'rating') sortOptions = { rating: -1 };
    if (sort === 'popular') sortOptions = { reviewCount: -1 };

    const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 50);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const productsRaw = await Product.find(query)
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name slug')
      .populate({ 
        path: 'vendorId', 
        match: { status: { $in: ['APPROVED', 'ACTIVE'] } }, 
        select: 'storeName slug logo' 
      })
      .sort(sortOptions)
      .lean();

    // Filter out products where vendor is not APPROVED/ACTIVE (vendorId will be null after match)
    const activeProducts = productsRaw.filter(p => p.vendorId !== null);
    
    const paginatedProducts = activeProducts.slice(skip, skip + safeLimit);

    return {
      products: paginatedProducts,
      total: activeProducts.length,
      page: safePage,
      pages: Math.ceil(activeProducts.length / safeLimit) || 1,
      limit: safeLimit,
    };
  },

  async getProductBySlug(slug) {
    const product = await Product.findOne({ slug, status: 'APPROVED', isDeleted: false })
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name slug')
      .populate({
        path: 'vendorId',
        match: { status: { $in: ['APPROVED', 'ACTIVE'] } },
        select: 'storeName slug logo description phone email'
      });

    if (!product || !product.vendorId) {
      throw new ApiError(404, 'Product not found or vendor is inactive', ERROR_CODES.NOT_FOUND);
    }

    return product;
  },

  async createProduct(vendorId, productData) {
    // Check if MRP >= Selling Price
    if (productData.price > productData.mrp) {
      throw new ApiError(400, 'Selling price cannot be greater than MRP', ERROR_CODES.BAD_REQUEST);
    }

    const slug = productData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const setting = await Settings.findOne({ key: 'PRODUCT_APPROVAL_REQUIRED' });
    const approvalRequired = setting ? setting.value : true; // Default to true if not found

    const initialStatus = approvalRequired ? 'PENDING_APPROVAL' : 'ACTIVE';
    // If they explicitly pass DRAFT, keep it as DRAFT
    const finalStatus = productData.status === 'DRAFT' ? 'DRAFT' : initialStatus;

    const product = await Product.create({
      ...productData,
      vendorId,
      slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: finalStatus,
      isDeleted: false,
    });

    return product;
  },

  async updateProduct(productId, vendorId, productData) {
    const product = await Product.findById(productId);
    if (!product || product.isDeleted) {
      throw new ApiError(404, 'Product not found', ERROR_CODES.NOT_FOUND);
    }

    if (product.vendorId.toString() !== vendorId.toString()) {
      throw new ApiError(403, 'Unauthorized to edit this product', ERROR_CODES.FORBIDDEN);
    }

    if (productData.price && productData.mrp && productData.price > productData.mrp) {
      throw new ApiError(400, 'Selling price cannot be greater than MRP', ERROR_CODES.BAD_REQUEST);
    }

    // Do not allow status change through regular update endpoint
    delete productData.status;
    delete productData.vendorId;

    Object.assign(product, productData);
    await product.save();
    return product;
  },

  async softDeleteProduct(productId, vendorId) {
    const product = await Product.findById(productId);
    if (!product || product.isDeleted) {
      throw new ApiError(404, 'Product not found', ERROR_CODES.NOT_FOUND);
    }

    if (product.vendorId.toString() !== vendorId.toString()) {
      throw new ApiError(403, 'Unauthorized to delete this product', ERROR_CODES.FORBIDDEN);
    }

    product.isDeleted = true;
    await product.save();

    await ProductStatusHistory.create({
      productId: product._id,
      vendorId: product.vendorId,
      previousStatus: product.status,
      newStatus: 'DELETED', // Not in enum but conceptually deleted
      reason: 'Soft delete by vendor',
      changedBy: vendorId, // Simulating User ObjectId using vendorId
    });

    return product;
  },

  async getVendorProducts(vendorId, { search, status, page = 1, limit = 10 } = {}) {
    const query = { vendorId, isDeleted: false };
    
    if (status) query.status = status;
    if (search) query.$text = { $search: search };

    const skip = (page - 1) * limit;
    const products = await Product.find(query)
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);
    
    // Also get stats
    const stats = await Product.aggregate([
      { $match: { vendorId, isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const formattedStats = {
      total: total,
      DRAFT: 0, PENDING_APPROVAL: 0, APPROVED: 0, REJECTED: 0, ACTIVE: 0, INACTIVE: 0
    };
    stats.forEach(s => { formattedStats[s._id] = s.count; });

    return {
      products,
      stats: formattedStats,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    };
  },

  async changeVendorProductStatus(productId, vendorId, newStatus) {
    const allowedTransitions = ['ACTIVE', 'INACTIVE', 'PENDING_APPROVAL']; // For Vendors
    if (!allowedTransitions.includes(newStatus)) {
      throw new ApiError(400, 'Invalid status transition requested', ERROR_CODES.BAD_REQUEST);
    }

    const product = await Product.findById(productId);
    if (!product || product.isDeleted) throw new ApiError(404, 'Product not found', ERROR_CODES.NOT_FOUND);
    if (product.vendorId.toString() !== vendorId.toString()) throw new ApiError(403, 'Unauthorized', ERROR_CODES.FORBIDDEN);

    const oldStatus = product.status;

    if (newStatus === 'PENDING_APPROVAL') {
      const setting = await Settings.findOne({ key: 'PRODUCT_APPROVAL_REQUIRED' });
      const approvalRequired = setting ? setting.value : true;
      if (!approvalRequired) {
        newStatus = 'ACTIVE';
      }
    }

    product.status = newStatus;
    await product.save();

    await ProductStatusHistory.create({
      productId: product._id,
      vendorId: product.vendorId,
      previousStatus: oldStatus,
      newStatus: newStatus,
      reason: 'Status change by vendor',
      changedBy: vendorId, // Using vendor user id for tracking
    });

    return product;
  },

  async getAdminProducts({ status, vendor, category, brand, date, page = 1, limit = 10 } = {}) {
    const query = { isDeleted: false };
    if (status) query.status = status;
    if (vendor) query.vendorId = vendor;
    if (category) query.categoryId = category;
    if (brand) query.brandId = brand;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.createdAt = { $gte: start, $lt: end };
    }

    const skip = (page - 1) * limit;
    const products = await Product.find(query)
      .populate('categoryId', 'name slug')
      .populate('brandId', 'name slug')
      .populate('vendorId', 'storeName slug logo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);
    return {
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    };
  },

  async updateProductStatus(productId, status, reason = '', adminUserId, ipAddress = '') {
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw new ApiError(400, 'Invalid status value', ERROR_CODES.BAD_REQUEST);
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(404, 'Product not found', ERROR_CODES.NOT_FOUND);
    }

    const oldStatus = product.status;
    product.status = status;
    await product.save();

    const { AuditLog } = await import('../models/AuditLog.js');
    await AuditLog.create({
      userId: adminUserId,
      action: `PRODUCT_STATUS_UPDATE_${status}`,
      entity: 'Product',
      entityId: productId,
      oldValue: oldStatus,
      newValue: status,
      ipAddress,
    });

    const { Vendor } = await import('../models/Vendor.js');
    const { notificationService } = await import('./notificationService.js');
    const vendor = await Vendor.findById(product.vendorId);
    if (vendor) {
      await notificationService.createNotification({
        userId: vendor.userId,
        title: `Product ${status}`,
        message: `Your product "${product.name}" has been ${status.toLowerCase()}.${reason ? ' Reason: ' + reason : ''}`,
        type: 'PRODUCT_STATUS',
        link: `/vendor/products`,
      });
    }

    await ProductStatusHistory.create({
      productId: product._id,
      vendorId: product.vendorId,
      previousStatus: oldStatus,
      newStatus: status,
      reason: reason || 'Admin review',
      changedBy: adminUserId,
    });

    return product;
  },
};
