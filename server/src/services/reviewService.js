import { Review } from '../models/Review.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const reviewService = {
  /**
   * Helper to recalculate and cache a product's average rating and review count.
   */
  async updateProductRatingCache(productId) {
    const stats = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId), status: 'APPROVED' } },
      {
        $group: {
          _id: '$productId',
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        rating: Math.round(stats[0].avgRating * 10) / 10,
        reviewCount: stats[0].totalReviews,
      });
    } else {
      await Product.findByIdAndUpdate(productId, {
        rating: 0,
        reviewCount: 0,
      });
    }
  },

  /**
   * Create a review for a purchased product.
   */
  async createReview({ userId, productId, rating, title, comment, body, images }) {
    // 1. Verify user purchased and received the product (DELIVERED status)
    const order = await Order.findOne({
      userId,
      orderStatus: 'DELIVERED',
      'items.productId': productId,
    });

    if (!order) {
      throw new ApiError(400, 'You can only review products you have purchased and received', ERROR_CODES.BAD_REQUEST);
    }

    // 2. Prevent duplicate reviews (productId + userId unique)
    const existing = await Review.findOne({ productId, userId });
    if (existing) {
      throw new ApiError(400, 'You have already reviewed this product', ERROR_CODES.BAD_REQUEST);
    }

    // 3. Create the review
    const content = comment || body || '';
    const review = await Review.create({
      productId,
      userId,
      rating,
      title,
      comment: content,
      body: content,
      images: images || [],
      isVerifiedPurchase: true,
      status: 'PENDING', // Require moderation before public display
    });

    return review;
  },

  /**
   * Update own review.
   */
  async updateReview(userId, reviewId, { rating, title, comment, body, images }) {
    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) {
      throw new ApiError(404, 'Review not found or unauthorized', ERROR_CODES.NOT_FOUND);
    }

    const content = comment || body || '';
    if (rating !== undefined) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (content !== undefined) {
      review.comment = content;
      review.body = content;
    }
    if (images !== undefined) review.images = images;
    
    // Reset status to PENDING upon modifications to re-moderate
    review.status = 'PENDING';
    await review.save();

    // Cache update triggers after admin approval changes, but sync now
    await this.updateProductRatingCache(review.productId);

    return review;
  },

  /**
   * Delete review.
   */
  async deleteReview(userId, reviewId, isAdmin = false) {
    const query = { _id: reviewId };
    if (!isAdmin) query.userId = userId;

    const review = await Review.findOne(query);
    if (!review) {
      throw new ApiError(404, 'Review not found or unauthorized', ERROR_CODES.NOT_FOUND);
    }

    await Review.deleteOne({ _id: reviewId });
    await this.updateProductRatingCache(review.productId);

    return true;
  },

  /**
   * Moderate review status (Admin only).
   */
  async moderateReview(reviewId, status) {
    const review = await Review.findByIdAndUpdate(reviewId, { status }, { new: true });
    if (!review) {
      throw new ApiError(404, 'Review not found', ERROR_CODES.NOT_FOUND);
    }

    // Update product cache based on new approved reviews count
    await this.updateProductRatingCache(review.productId);

    return review;
  },

  /**
   * Get approved reviews for a product with pagination.
   */
  async getProductReviews(productId, { page = 1, limit = 10 } = {}) {
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.max(1, parseInt(limit) || 10);
    const skip = (parsedPage - 1) * parsedLimit;

    const filter = { productId, status: 'APPROVED' };

    const list = await Review.find(filter)
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit);

    const total = await Review.countDocuments(filter);

    return {
      list,
      total,
      page: parsedPage,
      pages: Math.ceil(total / parsedLimit),
    };
  },

  /**
   * Get ratings summary and star distributions using MongoDB aggregations.
   */
  async getProductReviewSummary(productId) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(404, 'Product not found', ERROR_CODES.NOT_FOUND);
    }

    const summary = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId), status: 'APPROVED' } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
    ]);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    summary.forEach((item) => {
      if (distribution[item._id] !== undefined) {
        distribution[item._id] = item.count;
      }
    });

    return {
      averageRating: product.rating || 0,
      totalReviews: product.reviewCount || 0,
      distribution,
    };
  },
};

import mongoose from 'mongoose';
