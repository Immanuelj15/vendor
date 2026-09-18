import express from 'express';
import { getWishlist, toggleWishlistProduct } from '../controllers/wishlistController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// All wishlist routes require authentication
router.use(authenticate);

router.route('/')
  .get(getWishlist)
  .post(toggleWishlistProduct);

export default router;
