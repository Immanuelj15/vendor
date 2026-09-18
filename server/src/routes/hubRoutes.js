import express from 'express';
import {
  createHub,
  getHubs,
  getHubById,
  updateHub,
  updateHubStatus,
} from '../controllers/hubController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import {
  hubCreateSchema,
  hubStatusSchema,
} from '../validators/fulfillmentValidator.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

router.post('/', validateBody(hubCreateSchema), createHub);
router.get('/', getHubs);
router.get('/:id', getHubById);
router.put('/:id', validateBody(hubCreateSchema.partial()), updateHub);
router.put('/:id/status', validateBody(hubStatusSchema), updateHubStatus);

export default router;
