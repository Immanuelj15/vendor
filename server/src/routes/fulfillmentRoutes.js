import express from 'express';
import {
  pickFulfillmentItems,
  packFulfillment,
  receiveFulfillmentAtHub,
  getAdminFulfillments,
  getAdminOrders,
  getVendorFulfillments,
  getShopkeeperFulfillments,
  getCustomerOrderTracking,
  getFulfillmentDetails,
} from '../controllers/fulfillmentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import {
  pickItemsSchema,
  packFulfillmentSchema,
} from '../validators/fulfillmentValidator.js';

const router = express.Router();

router.use(authenticate);

// Customer Tracking
router.get('/orders/:id/tracking', getCustomerOrderTracking);

// Vendor Routes
router.get('/vendors/fulfillments', authorize('VENDOR', 'ADMIN', 'SUPER_ADMIN'), getVendorFulfillments);
router.put(
  '/vendors/fulfillments/:id/pick',
  authorize('VENDOR', 'ADMIN', 'SUPER_ADMIN'),
  validateBody(pickItemsSchema),
  pickFulfillmentItems
);
router.post(
  '/vendors/fulfillments/:id/pack',
  authorize('VENDOR', 'ADMIN', 'SUPER_ADMIN'),
  validateBody(packFulfillmentSchema),
  packFulfillment
);

// Shopkeeper Routes
router.get('/shopkeepers/fulfillments', authorize('SHOPKEEPER', 'ADMIN', 'SUPER_ADMIN'), getShopkeeperFulfillments);

// Hub Staff Routes
router.put('/hubs/fulfillments/:id/receive', authorize('HUB_STAFF', 'ADMIN', 'SUPER_ADMIN'), receiveFulfillmentAtHub);

// Admin Routes
router.get('/admin/fulfillment', authorize('ADMIN', 'SUPER_ADMIN'), getAdminFulfillments);
router.get('/admin/orders', authorize('ADMIN', 'SUPER_ADMIN'), getAdminOrders);

// General Details Route
router.get('/:id', getFulfillmentDetails);

export default router;
