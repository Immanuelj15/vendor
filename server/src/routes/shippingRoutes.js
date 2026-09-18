import express from 'express';
import { 
  getVendorShippingAddresses, 
  addVendorShippingAddress, 
  createShipment, 
  requestPickup, 
  getShipmentTracking,
  handleCourierWebhook
} from '../controllers/shippingController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public / Webhook
router.post('/webhook/:provider', handleCourierWebhook);

router.use(authenticate);

// Vendor Shipping Addresses
router.get('/vendor/shipping-addresses', authorize('VENDOR'), getVendorShippingAddresses);
router.post('/vendor/shipping-addresses', authorize('VENDOR'), addVendorShippingAddress);

// Vendor Shipments
router.post('/vendor/shipments', authorize('VENDOR'), createShipment);
router.post('/vendor/shipments/:id/pickup', authorize('VENDOR'), requestPickup);
router.get('/vendor/shipments/:id/tracking', authorize('VENDOR'), getShipmentTracking);

// Customer Tracking
router.get('/customer/shipments/:id/tracking', authorize('CUSTOMER'), getShipmentTracking);

export default router;
