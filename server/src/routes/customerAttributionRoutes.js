import express from 'express';
import { getMyAttribution, getMyAttributionHistory, requestAttributionChange } from '../controllers/customerAttributionController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('CUSTOMER', 'USER'));

router.get('/', getMyAttribution);
router.get('/history', getMyAttributionHistory);
router.post('/change-request', requestAttributionChange);

export default router;
