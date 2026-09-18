import { reviewService } from '../services/reviewService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { reviewInputSchema } from '../utils/validators.js';

export const getProductReviews = asyncWrapper(async (req, res) => {
  const { productId } = req.params;
  const { page, limit } = req.query;

  const reviewsResult = await reviewService.getProductReviews(productId, { page, limit });
  const summary = await reviewService.getProductReviewSummary(productId);

  return res.status(200).json(
    new ApiResponse(
      200,
      { reviews: reviewsResult.list, total: reviewsResult.total, page: reviewsResult.page, pages: reviewsResult.pages, summary },
      'Product reviews and ratings summary retrieved'
    )
  );
});

export const createReview = asyncWrapper(async (req, res) => {
  const validated = reviewInputSchema.parse(req.body);
  const review = await reviewService.createReview({
    userId: req.user._id,
    ...validated,
  });
  return res.status(201).json(new ApiResponse(201, { review }, 'Review created successfully. Pending moderation approval.'));
});

export const updateReview = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const validated = reviewInputSchema.partial().parse(req.body);
  const review = await reviewService.updateReview(req.user._id, id, validated);
  return res.status(200).json(new ApiResponse(200, { review }, 'Review updated successfully. Pending moderation approval.'));
});

export const deleteReview = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user?.role);
  await reviewService.deleteReview(req.user._id, id, isAdmin);
  return res.status(200).json(new ApiResponse(200, null, 'Review deleted successfully'));
});

export const moderateReviewStatus = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    throw new ApiError(400, 'Invalid status. Must be APPROVED or REJECTED', ERROR_CODES.BAD_REQUEST);
  }

  const review = await reviewService.moderateReview(id, status);
  return res.status(200).json(new ApiResponse(200, { review }, `Review status moderated to ${status}`));
});
