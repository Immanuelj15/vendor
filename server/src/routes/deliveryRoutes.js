import express from 'express';
import {
  registerDeliveryPartner,
  assignDelivery,
  getMyDeliveries,
  updateAssignmentStatus,
} from '../controllers/deliveryController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import {
  deliveryAssignSchema,
  deliveryStatusSchema,
} from '../validators/fulfillmentValidator.js';

const router = express.Router();

router.use(authenticate);

// Delivery Partner Portal
router.get('/my', authorize('DELIVERY_PARTNER', 'ADMIN', 'SUPER_ADMIN'), getMyDeliveries);
router.put('/:id/status', authorize('DELIVERY_PARTNER', 'ADMIN', 'SUPER_ADMIN'), validateBody(deliveryStatusSchema), updateAssignmentStatus);

// Admin Delivery Operations
router.post('/register', authorize('ADMIN', 'SUPER_ADMIN'), registerDeliveryPartner);
router.post('/:fulfillmentId/assign', authorize('ADMIN', 'SUPER_ADMIN'), validateBody(deliveryAssignSchema), assignDelivery);

export default router;
