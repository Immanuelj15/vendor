import express from 'express';
import {
  createPaymentOrder,
  verifyPaymentSignature,
  getPaymentById,
  handleWebhook,
} from '../controllers/paymentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import {
  createPaymentOrderSchema,
  verifyPaymentSignatureSchema,
} from '../validators/paymentValidator.js';

const router = express.Router();

// Webhook endpoint does not require user authentication
router.post('/webhook', handleWebhook);

// Authenticated routes below
router.use(authenticate);

router.post('/create-order', validateBody(createPaymentOrderSchema), createPaymentOrder);
router.post('/verify', validateBody(verifyPaymentSignatureSchema), verifyPaymentSignature);
router.get('/:id', getPaymentById);

export default router;
