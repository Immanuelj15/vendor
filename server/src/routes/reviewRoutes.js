import express from 'express';
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  moderateReviewStatus,
} from '../controllers/reviewController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public reviews retrieval
router.get('/product/:productId', getProductReviews);

// Customer actions (requires authentication)
router.post('/', authenticate, createReview);
router.put('/:id', authenticate, updateReview);
router.delete('/:id', authenticate, deleteReview);

// Admin-only moderation
router.put('/:id/moderate', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), moderateReviewStatus);

export default router;
