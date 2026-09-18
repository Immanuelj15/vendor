import express from 'express';
import {
  getProducts,
  getProductBySlug,
  getFeaturedProducts,
  getNewArrivals,
  getBestSelling,
  getTopRated,
} from '../controllers/productController.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/best-selling', getBestSelling);
router.get('/top-rated', getTopRated);
router.get('/:slug', getProductBySlug);

export default router;
