import express from 'express';
import {
  cancelOrder,
  requestReturn,
  getReturnRequests,
  updateReturnStatus,
} from '../controllers/returnController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import {
  returnRequestSchema,
  returnStatusSchema,
} from '../validators/fulfillmentValidator.js';

const router = express.Router();

router.use(authenticate);

// Customer Actions
router.post('/orders/:id/cancel', cancelOrder);
router.post('/orders/:id/return', validateBody(returnRequestSchema), requestReturn);

// Admin Actions
router.get('/admin', authorize('ADMIN', 'SUPER_ADMIN'), getReturnRequests);
router.put('/admin/:id/status', authorize('ADMIN', 'SUPER_ADMIN'), validateBody(returnStatusSchema), updateReturnStatus);

export default router;
