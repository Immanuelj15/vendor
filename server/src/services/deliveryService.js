import mongoose from 'mongoose';
import { DeliveryPartner } from '../models/DeliveryPartner.js';
import { DeliveryAssignment } from '../models/DeliveryAssignment.js';
import { Fulfillment } from '../models/Fulfillment.js';
import { Package } from '../models/Package.js';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { notificationService } from './notificationService.js';
import { fulfillmentStatusService } from './fulfillmentStatusService.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const deliveryService = {
  async registerDeliveryPartner(partnerData) {
    const existing = await DeliveryPartner.findOne({ userId: partnerData.userId });
    if (existing) {
      throw new ApiError(400, 'Delivery partner profile already exists for this user', ERROR_CODES.BAD_REQUEST);
    }

    // Update user role to DELIVERY_PARTNER
    await User.findByIdAndUpdate(partnerData.userId, { role: 'DELIVERY_PARTNER' });

    const partner = await DeliveryPartner.create({
      userId: partnerData.userId,
      name: partnerData.name,
      phone: partnerData.phone,
      vehicleType: partnerData.vehicleType,
      vehicleNumber: partnerData.vehicleNumber,
      serviceZones: partnerData.serviceZones || [],
      assignedHubId: partnerData.assignedHubId,
    });
    return partner;
  },

  async assignDelivery(fulfillmentId, deliveryPartnerId, actor) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const fulfillment = await Fulfillment.findById(fulfillmentId).session(session);
      if (!fulfillment) {
        throw new ApiError(404, 'Fulfillment not found', ERROR_CODES.NOT_FOUND);
      }

      if (!['PACKED', 'READY_FOR_DISPATCH'].includes(fulfillment.status)) {
        throw new ApiError(400, 'Fulfillment is not in a ready-for-dispatch state', ERROR_CODES.BAD_REQUEST);
      }

      const partner = await DeliveryPartner.findById(deliveryPartnerId).session(session);
      if (!partner || partner.status === 'INACTIVE') {
        throw new ApiError(400, 'Invalid or inactive delivery partner', ERROR_CODES.BAD_REQUEST);
      }

      // Check if there is already an active assignment
      const existing = await DeliveryAssignment.findOne({
        fulfillmentId,
        status: { $in: ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'] },
      }).session(session);

      if (existing) {
        throw new ApiError(400, 'Fulfillment already has an active delivery assignment', ERROR_CODES.BAD_REQUEST);
      }

      const pkg = await Package.findOne({ fulfillmentId }).session(session);

      const assignment = await DeliveryAssignment.create(
        [
          {
            fulfillmentId,
            packageId: pkg ? pkg._id : null,
            deliveryPartnerId,
            hubId: fulfillment.hubId || partner.assignedHubId,
            status: 'ASSIGNED',
            assignedAt: new Date(),
          },
        ],
        { session }
      );

      // Transition to READY_FOR_DISPATCH if not already there
      if (fulfillment.status === 'PACKED') {
        await fulfillmentStatusService.transitionFulfillmentStatus(
          fulfillment._id,
          'READY_FOR_DISPATCH',
          actor,
          `Assigned to delivery partner ${partner.name}`,
          session
        );
      }

      // Notify Delivery Partner & Customer
      try {
        await notificationService.createNotification({
          userId: partner.userId,
          title: 'New Delivery Assignment',
          message: `You have been assigned a new delivery for Fulfillment #${fulfillment._id}.`,
          type: 'DELIVERY_ASSIGNED',
          link: '/delivery/dashboard'
        }, { session });

        const order = await Order.findById(fulfillment.orderId).session(session);
        if (order) {
          await notificationService.createNotification({
            userId: order.userId,
            title: 'Delivery Partner Assigned',
            message: `Your order #${order.orderNumber} has been assigned to delivery partner: ${partner.name} (Phone: ${partner.phone}).`,
            type: 'DELIVERY_ASSIGNED',
            link: `/account/orders/${order._id}`
          }, { session });
        }
      } catch (err) {
        console.error('Failed to send assignment notifications:', err);
      }

      await session.commitTransaction();
      session.endSession();

      return assignment[0];
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  },

  async updateAssignmentStatus(assignmentId, newStatus, actor, details = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const assignment = await DeliveryAssignment.findById(assignmentId).session(session);
      if (!assignment) {
        throw new ApiError(404, 'Delivery assignment not found', ERROR_CODES.NOT_FOUND);
      }

      const partner = await DeliveryPartner.findOne({ userId: actor._id }).session(session);
      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(actor.role);

      if (!isAdmin && (!partner || assignment.deliveryPartnerId.toString() !== partner._id.toString())) {
        throw new ApiError(
          403,
          'Access denied: You are not authorized to update this assignment',
          ERROR_CODES.FORBIDDEN
        );
      }

      const oldStatus = assignment.status;
      if (oldStatus === newStatus) {
        await session.abortTransaction();
        session.endSession();
        return assignment; // Idempotency
      }

      const allowedTransitions = {
        ASSIGNED: ['ACCEPTED', 'CANCELLED'],
        ACCEPTED: ['PICKED_UP', 'FAILED'],
        PICKED_UP: ['OUT_FOR_DELIVERY', 'FAILED'],
        OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED'],
        DELIVERED: [],
        FAILED: ['ASSIGNED'],
        CANCELLED: [],
      };

      if (!allowedTransitions[oldStatus]?.includes(newStatus)) {
        throw new ApiError(
          400,
          `Invalid assignment status transition from ${oldStatus} to ${newStatus}`,
          ERROR_CODES.BAD_REQUEST
        );
      }

      assignment.status = newStatus;
      if (newStatus === 'ACCEPTED') assignment.acceptedAt = new Date();
      if (newStatus === 'PICKED_UP') assignment.pickedUpAt = new Date();
      if (newStatus === 'OUT_FOR_DELIVERY') assignment.outForDeliveryAt = new Date();
      if (newStatus === 'DELIVERED') {
        assignment.deliveredAt = new Date();
        // Record proofs
        if (assignment.packageId) {
          await Package.findByIdAndUpdate(
            assignment.packageId,
            { status: 'DELIVERED', deliveredAt: new Date() },
            { session }
          );
        }
      }
      if (newStatus === 'FAILED') assignment.failedAt = new Date();

      await assignment.save({ session });

      // Notifications based on newStatus
      try {
        const order = await Order.findById(fulfillment.orderId).session(session);
        if (newStatus === 'ACCEPTED') {
          await notificationService.createNotification({
            userId: actor._id,
            title: 'Delivery Assignment Accepted',
            message: `You accepted delivery assignment #${assignment._id}.`,
            type: 'DELIVERY_ASSIGNED',
            link: '/delivery/dashboard'
          }, { session });
        } else if (newStatus === 'FAILED') {
          // Notify partner
          await notificationService.createNotification({
            userId: actor._id,
            title: 'Delivery Assignment Failed',
            message: `Delivery assignment #${assignment._id} failed. Package returned to Hub.`,
            type: 'DELIVERY_FAILED',
            link: '/delivery/dashboard'
          }, { session });

          // Notify customer
          if (order) {
            await notificationService.createNotification({
              userId: order.userId,
              title: 'Delivery Attempt Failed',
              message: `Delivery attempt for order #${order.orderNumber} failed. Reason: ${details.failureReason || 'address not reachable'}. We will try again.`,
              type: 'DELIVERY_FAILED',
              link: `/account/orders/${order._id}`
            }, { session });
          }
        } else if (newStatus === 'CANCELLED') {
          const partnerUser = await DeliveryPartner.findById(assignment.deliveryPartnerId).session(session);
          if (partnerUser) {
            await notificationService.createNotification({
              userId: partnerUser.userId,
              title: 'Delivery Assignment Cancelled',
              message: `Your delivery assignment for fulfillment #${assignment.fulfillmentId} has been cancelled/reassigned.`,
              type: 'DELIVERY_FAILED',
              link: '/delivery/dashboard'
            }, { session });
          }
        }
      } catch (err) {
        console.error('Failed to send assignment status update notifications:', err);
      }

      // Sync Fulfillment
      const fulfillment = await Fulfillment.findById(assignment.fulfillmentId).session(session);
      if (fulfillment) {
        if (newStatus === 'PICKED_UP') {
          await fulfillmentStatusService.transitionFulfillmentStatus(
            fulfillment._id,
            'DISPATCHED',
            actor,
            'Package picked up by delivery partner',
            session
          );
        } else if (newStatus === 'OUT_FOR_DELIVERY') {
          await fulfillmentStatusService.transitionFulfillmentStatus(
            fulfillment._id,
            'OUT_FOR_DELIVERY',
            actor,
            'Out for delivery',
            session
          );
        } else if (newStatus === 'DELIVERED') {
          await fulfillmentStatusService.transitionFulfillmentStatus(
            fulfillment._id,
            'DELIVERED',
            actor,
            `Delivered to ${details.recipientName || 'customer'}. Note: ${details.deliveryNote || ''}`,
            session
          );
        } else if (newStatus === 'FAILED') {
          // Revert fulfillment to READY_FOR_DISPATCH for re-assignment
          await fulfillmentStatusService.transitionFulfillmentStatus(
            fulfillment._id,
            'READY_FOR_DISPATCH',
            actor,
            `Delivery attempt failed: ${details.failureReason || 'unknown'}. Reassigned back to Hub.`,
            session
          );
        }
      }

      await session.commitTransaction();
      session.endSession();

      return assignment;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  },
};
