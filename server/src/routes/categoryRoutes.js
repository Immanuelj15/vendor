import express from 'express';
import { getCategories, createCategory } from '../controllers/categoryController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', getCategories);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createCategory);

export default router;
