import { Notification } from '../models/Notification.js';

export const notificationService = {
  async createNotification({ userId, title, message, type = 'SYSTEM', link = '', data = null, priority = 'NORMAL', dedupeKey = null }, options = {}) {
    const { session } = options;
    if (dedupeKey) {
      const existing = await Notification.findOne({ dedupeKey }).session(session);
      if (existing) return existing;
    }

    try {
      const notifData = {
        userId,
        title,
        message,
        type,
        link,
        data,
        priority,
      };
      if (dedupeKey) {
        notifData.dedupeKey = dedupeKey;
      }
      const notification = new Notification(notifData);
      return await notification.save({ session });
    } catch (err) {
      if (err.code === 11000 && dedupeKey) {
        const existing = await Notification.findOne({ dedupeKey }).session(session);
        if (existing) return existing;
      }
      throw err;
    }
  },

  async createBulkNotifications(notifications, options = {}) {
    const { session } = options;
    const finalNotifications = [];
    for (const notif of notifications) {
      if (notif.dedupeKey) {
        const existing = await Notification.findOne({ dedupeKey: notif.dedupeKey }).session(session);
        if (!existing) {
          finalNotifications.push(notif);
        }
      } else {
        finalNotifications.push(notif);
      }
    }
    if (finalNotifications.length === 0) return [];
    try {
      return await Notification.insertMany(finalNotifications, { session });
    } catch (err) {
      if (err.code === 11000) {
        const results = [];
        for (const notif of finalNotifications) {
          try {
            const saved = await this.createNotification(notif, { session });
            results.push(saved);
          } catch (e) {
            // Ignore duplicates
          }
        }
        return results;
      }
      throw err;
    }
  },

  async getNotifications(userId, { page = 1, limit = 20, isRead, type } = {}) {
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.max(1, parseInt(limit) || 20);
    const skip = (parsedPage - 1) * parsedLimit;
    const filter = { userId };

    if (isRead !== undefined) {
      filter.isRead = isRead === 'true' || isRead === true;
    }

    if (type) {
      filter.type = type;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit);

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    return {
      notifications,
      total,
      unreadCount,
      page: parsedPage,
      pages: Math.ceil(total / parsedLimit),
    };
  },

  async getUnreadCount(userId) {
    return await Notification.countDocuments({ userId, isRead: false });
  },

  async markRead(userId, notificationId) {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  },

  async markAllRead(userId) {
    return await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  },

  async deleteNotification(userId, notificationId) {
    return await Notification.findOneAndDelete({ _id: notificationId, userId });
  }
};
