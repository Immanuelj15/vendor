import { Fulfillment } from '../models/Fulfillment.js';
import { VendorOrder } from '../models/VendorOrder.js';
import { OrderStatusHistory } from '../models/OrderStatusHistory.js';
import { orderStatusService } from './orderStatusService.js';
import { notificationService } from './notificationService.js';
import { Vendor } from '../models/Vendor.js';
import { Shopkeeper } from '../models/Shopkeeper.js';
import { Shop } from '../models/Shop.js';
import { DeliveryPartner } from '../models/DeliveryPartner.js';
import { DeliveryAssignment } from '../models/DeliveryAssignment.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

const ALLOWED_TRANSITIONS = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PICKED', 'CANCELLED'],
  PICKED: ['PACKED', 'CANCELLED'],
  PACKED: ['READY_FOR_DISPATCH', 'CANCELLED'],
  READY_FOR_DISPATCH: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'PROCESSING', 'CANCELLED'],
  DELIVERED: ['RETURN_REQUESTED'],
  RETURN_REQUESTED: ['RETURNED', 'DELIVERED'],
  RETURNED: [],
  CANCELLED: [],
};

const VENDOR_ORDER_STATUS_MAP = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PICKED: 'PROCESSING',
  PACKED: 'PACKED',
  READY_FOR_DISPATCH: 'PACKED',
  DISPATCHED: 'SHIPPED',
  OUT_FOR_DELIVERY: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  RETURN_REQUESTED: 'DELIVERED',
  RETURNED: 'DELIVERED',
};

export const fulfillmentStatusService = {
  async transitionFulfillmentStatus(fulfillmentId, newStatus, actor, note = '', session = null) {
    // 1. Load fulfillment
    const fulfillment = await Fulfillment.findById(fulfillmentId).session(session);
    if (!fulfillment) {
      throw new ApiError(404, 'Fulfillment not found', ERROR_CODES.NOT_FOUND);
    }

    const oldStatus = fulfillment.status;

    // 2. Check duplicate transition
    if (oldStatus === newStatus) {
      return fulfillment; // Noop for idempotency
    }

    // 3. Verify allowed transitions
    const allowed = ALLOWED_TRANSITIONS[oldStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new ApiError(
        400,
        `Invalid status transition from ${oldStatus} to ${newStatus}`,
        ERROR_CODES.BAD_REQUEST
      );
    }

    // 4. Verify actor authorization
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(actor.role);
    if (!isAdmin) {
      if (actor.role === 'VENDOR') {
        const vendor = await Vendor.findOne({ userId: actor._id }).session(session);
        if (!vendor || fulfillment.sourceType !== 'VENDOR' || fulfillment.sourceId.toString() !== vendor._id.toString()) {
          throw new ApiError(403, 'Access denied: You do not own this fulfillment', ERROR_CODES.FORBIDDEN);
        }
      } else if (actor.role === 'SHOPKEEPER') {
        const shopkeeper = await Shopkeeper.findOne({ userId: actor._id }).session(session);
        const shop = await Shop.findOne({ shopkeeperId: shopkeeper?._id }).session(session);
        if (!shop || fulfillment.sourceType !== 'SHOP' || fulfillment.sourceId.toString() !== shop._id.toString()) {
          throw new ApiError(403, 'Access denied: You do not own this shop fulfillment', ERROR_CODES.FORBIDDEN);
        }
      } else if (actor.role === 'HUB_STAFF') {
        const hasHubAccess = actor.authorizedHubs?.some(
          (hId) => hId.toString() === fulfillment.hubId?.toString()
        );
        if (!hasHubAccess) {
          throw new ApiError(403, 'Access denied: You are not authorized for this hub', ERROR_CODES.FORBIDDEN);
        }
      } else if (actor.role === 'DELIVERY_PARTNER') {
        const partner = await DeliveryPartner.findOne({ userId: actor._id }).session(session);
        if (!partner) {
          throw new ApiError(403, 'Access denied: Delivery partner profile not found', ERROR_CODES.FORBIDDEN);
        }
        const activeAssignment = await DeliveryAssignment.findOne({
          fulfillmentId: fulfillment._id,
          deliveryPartnerId: partner._id,
          status: { $nin: ['CANCELLED', 'FAILED'] },
        }).session(session);

        if (!activeAssignment) {
          throw new ApiError(
            403,
            'Access denied: You are not assigned to this fulfillment',
            ERROR_CODES.FORBIDDEN
          );
        }
      } else {
        // Customer or standard user cannot transition directly
        throw new ApiError(403, 'Access denied: Unauthorized to change status', ERROR_CODES.FORBIDDEN);
      }
    }

    // 5. Update status and timestamps
    fulfillment.status = newStatus;
    if (newStatus === 'PROCESSING') fulfillment.assignedAt = new Date();
    if (newStatus === 'PACKED') fulfillment.packedAt = new Date();
    if (newStatus === 'DISPATCHED') fulfillment.dispatchedAt = new Date();
    if (newStatus === 'DELIVERED') fulfillment.deliveredAt = new Date();
    if (newStatus === 'CANCELLED') fulfillment.cancelledAt = new Date();
    await fulfillment.save({ session });

    // 6. Create Audit/Status History Log
    await OrderStatusHistory.create(
      [
        {
          orderId: fulfillment.orderId,
          fulfillmentId: fulfillment._id,
          status: newStatus,
          actorUserId: actor._id,
          note,
        },
      ],
      { session }
    );

    // 7. Update related VendorOrder status
    const mappedVendorStatus = VENDOR_ORDER_STATUS_MAP[newStatus];
    if (mappedVendorStatus) {
      await VendorOrder.findByIdAndUpdate(
        fulfillment.vendorOrderId,
        { status: mappedVendorStatus },
        { session }
      );
    }

    // 8. Update parent Order status (after transaction commits or inside session)
    if (session) {
      // mongoose lets us run queries within sessions
      await orderStatusService.deriveParentOrderStatus(fulfillment.orderId);
    } else {
      await orderStatusService.deriveParentOrderStatus(fulfillment.orderId);
    }

    // 9. Send Notification to Customer/Vendor/Staff
    try {
      const vendorOrder = await VendorOrder.findById(fulfillment.vendorOrderId).session(session);
      
      // Customer Notification
      const customerUserId = vendorOrder?.userId;
      if (customerUserId) {
        await notificationService.createNotification(
          {
            userId: customerUserId,
            title: `Order Update: ${newStatus}`,
            message: `Your order item has been updated to status: ${newStatus}.`,
            type: 'ORDER',
            link: `/account/orders/${fulfillment.orderId}`,
          },
          { session }
        );
      }

      // Vendor Notification
      if (vendorOrder) {
        const vendor = await Vendor.findById(vendorOrder.vendorId).session(session);
        if (vendor && vendor.userId) {
          await notificationService.createNotification(
            {
              userId: vendor.userId,
              title: `Sub-Order Update: ${newStatus}`,
              message: `Sub-order #${vendorOrder.subOrderNumber} has been updated to: ${newStatus}.`,
              type: 'VENDOR',
              link: '/vendor/dashboard',
            },
            { session }
          );
        }
      }

      // Hub Staff Notification
      if (fulfillment.hubId) {
        const hubStaffList = await User.find({
          role: 'HUB_STAFF',
          authorizedHubs: fulfillment.hubId,
        }).session(session);

        for (const staff of hubStaffList) {
          await notificationService.createNotification(
            {
              userId: staff._id,
              title: `Hub Operational Event: ${newStatus}`,
              message: `Fulfillment #${fulfillment._id} has been updated to: ${newStatus}.`,
              type: 'SYSTEM',
              link: '/hub/dashboard',
            },
            { session }
          );
        }
      }
    } catch (err) {
      console.error('Notification failed to send:', err);
    }

    return fulfillment;
  },
};
