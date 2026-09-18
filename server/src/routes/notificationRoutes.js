import express from 'express';
import { getNotifications, markRead, markAllRead, deleteNotification } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getNotifications);
router.put('/:id/read', markRead);
router.put('/read-all', markAllRead);
router.delete('/:id', deleteNotification);

export default router;
