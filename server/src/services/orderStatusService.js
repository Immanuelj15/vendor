import { Order } from '../models/Order.js';
import { Fulfillment } from '../models/Fulfillment.js';
import { notificationService } from './notificationService.js';

export const orderStatusService = {
  async deriveParentOrderStatus(parentOrderId) {
    const order = await Order.findById(parentOrderId);
    if (!order) return;

    const oldStatus = order.orderStatus;
    const fulfillments = await Fulfillment.find({ orderId: parentOrderId });
    if (fulfillments.length === 0) return oldStatus;

    const statuses = fulfillments.map((f) => f.status);
    let targetStatus = oldStatus;

    // 1. If all are CANCELLED -> CANCELLED
    if (statuses.every((s) => s === 'CANCELLED')) {
      targetStatus = 'CANCELLED';
    }
    // 2. If all are RETURNED (or cancelled) -> RETURNED
    else if (statuses.every((s) => s === 'RETURNED' || s === 'CANCELLED')) {
      const allCancelled = statuses.every((s) => s === 'CANCELLED');
      targetStatus = allCancelled ? 'CANCELLED' : 'RETURNED';
    }
    // 3. If all items are completed/delivered/cancelled/returned
    else if (statuses.every((s) => ['DELIVERED', 'CANCELLED', 'RETURNED'].includes(s))) {
      const anyDelivered = statuses.some((s) => s === 'DELIVERED');
      const anyReturned = statuses.some((s) => s === 'RETURNED');
      targetStatus = anyReturned ? 'RETURNED' : anyDelivered ? 'DELIVERED' : 'CANCELLED';
    }
    // 4. If any are RETURN_REQUESTED -> RETURN_REQUESTED
    else if (statuses.some((s) => s === 'RETURN_REQUESTED')) {
      targetStatus = 'RETURN_REQUESTED';
    }
    // 5. If any are OUT_FOR_DELIVERY -> OUT_FOR_DELIVERY
    else if (statuses.some((s) => s === 'OUT_FOR_DELIVERY')) {
      targetStatus = 'OUT_FOR_DELIVERY';
    }
    // 6. If any are DISPATCHED -> SHIPPED
    else if (statuses.some((s) => s === 'DISPATCHED' || s === 'READY_FOR_DISPATCH')) {
      targetStatus = 'SHIPPED';
    }
    // 7. If any are PACKED -> PACKED
    else if (statuses.some((s) => s === 'PACKED')) {
      targetStatus = 'PACKED';
    }
    // 8. If any are PROCESSING or PICKED -> PROCESSING
    else if (statuses.some((s) => ['PROCESSING', 'PICKED'].includes(s))) {
      targetStatus = 'PROCESSING';
    }
    // 9. If any are PENDING -> CONFIRMED
    else {
      targetStatus = 'CONFIRMED';
    }

    if (targetStatus !== oldStatus) {
      order.orderStatus = targetStatus;
      await order.save();

      // Trigger Notification
      const typeMapping = {
        CONFIRMED: 'ORDER_CONFIRMED',
        PROCESSING: 'ORDER_PROCESSING',
        PACKED: 'ORDER_PACKED',
        SHIPPED: 'ORDER_DISPATCHED',
        OUT_FOR_DELIVERY: 'ORDER_OUT_FOR_DELIVERY',
        DELIVERED: 'ORDER_DELIVERED',
        CANCELLED: 'ORDER_CANCELLED',
        RETURN_REQUESTED: 'RETURN_REQUESTED',
        RETURNED: 'RETURN_COMPLETED',
      };

      const notificationType = typeMapping[targetStatus] || 'ORDER';
      const formattedStatus = targetStatus.replace(/_/g, ' ').toLowerCase();

      try {
        await notificationService.createNotification({
          userId: order.userId,
          title: `Order Status: ${targetStatus}`,
          message: `Your order #${order.orderNumber} is now ${formattedStatus}.`,
          type: notificationType,
          link: `/account/orders/${order._id}`,
        }, { dedupeKey: `${order._id}:${notificationType}` });

        if (['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(targetStatus)) {
          const { emailService } = await import('./emailService.js');
          await emailService.sendDeliveryUpdate(order, targetStatus);
        }
      } catch (err) {
        console.error('Failed to create order status transition notification/email:', err);
      }
    }

    return targetStatus;
  },
};
