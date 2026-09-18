import { notificationService } from '../services/notificationService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

export const getNotifications = asyncWrapper(async (req, res) => {
  const result = await notificationService.getNotifications(req.user._id, req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Notifications retrieved successfully'));
});

export const markRead = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const notification = await notificationService.markRead(req.user._id, id);
  if (!notification) {
    return res.status(404).json(new ApiResponse(404, null, 'Notification not found'));
  }
  return res.status(200).json(new ApiResponse(200, { notification }, 'Notification marked as read'));
});

export const markAllRead = asyncWrapper(async (req, res) => {
  const result = await notificationService.markAllRead(req.user._id);
  return res.status(200).json(new ApiResponse(200, result, 'All notifications marked as read'));
});

export const deleteNotification = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const notification = await notificationService.deleteNotification(req.user._id, id);
  if (!notification) {
    return res.status(404).json(new ApiResponse(404, null, 'Notification not found'));
  }
  return res.status(200).json(new ApiResponse(200, null, 'Notification deleted successfully'));
});
