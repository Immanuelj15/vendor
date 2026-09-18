import express from 'express';
import { createOrder, getMyOrders, getOrderById, updateOrderStatus, getOrderInvoice } from '../controllers/orderController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { orderStatusSchema } from '../validators/adminValidator.js';

const router = express.Router();

router.use(authenticate);

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id/invoice', getOrderInvoice);
router.get('/:id', getOrderById);
router.put('/:id/status', validateBody(orderStatusSchema), updateOrderStatus);

export default router;
