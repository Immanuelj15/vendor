import express from 'express';
import {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
} from '../controllers/brandController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public
router.get('/', getBrands);

// Admin Only CRUD
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createBrand);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), updateBrand);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), deleteBrand);

export default router;
