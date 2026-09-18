import mongoose from 'mongoose';
import { ReturnRequest } from '../models/ReturnRequest.js';
import { Fulfillment } from '../models/Fulfillment.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Commission } from '../models/Commission.js';
import { Vendor } from '../models/Vendor.js';
import { VendorOrder } from '../models/VendorOrder.js';
import { VendorLedger } from '../models/VendorLedger.js';
import { PlatformLedger } from '../models/PlatformLedger.js';
import { VendorSettlement } from '../models/VendorSettlement.js';
import { StockTransaction } from '../models/StockTransaction.js';
import { Payment } from '../models/Payment.js';
import { CoinTransaction } from '../models/CoinTransaction.js';
import { User } from '../models/User.js';
import { notificationService } from './notificationService.js';
import { fulfillmentStatusService } from './fulfillmentStatusService.js';
import { fairCoinService } from './fairCoinService.js';
import { moneyUtils } from '../utils/moneyUtils.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const returnService = {
  async requestReturn(orderId, { fulfillmentId, reason, items }, actor) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError(404, 'Order not found', ERROR_CODES.NOT_FOUND);
    }

    if (order.userId.toString() !== actor._id.toString()) {
      throw new ApiError(403, 'Access denied: You do not own this order', ERROR_CODES.FORBIDDEN);
    }

    if (order.orderStatus !== 'DELIVERED') {
      throw new ApiError(400, 'Order is not delivered yet', ERROR_CODES.BAD_REQUEST);
    }

    const fulfillment = await Fulfillment.findById(fulfillmentId);
    if (!fulfillment || fulfillment.orderId.toString() !== orderId) {
      throw new ApiError(404, 'Fulfillment not found for this order', ERROR_CODES.NOT_FOUND);
    }

    if (fulfillment.status !== 'DELIVERED') {
      throw new ApiError(400, 'This fulfillment is not marked as delivered', ERROR_CODES.BAD_REQUEST);
    }

    // Check return window (e.g. 7 days from deliveredAt)
    const deliveredAt = fulfillment.deliveredAt || fulfillment.updatedAt;
    const daysSinceDelivery = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > 7) {
      throw new ApiError(400, 'Return window (7 days) has expired', ERROR_CODES.BAD_REQUEST);
    }

    // Check if there is already a return request
    const existing = await ReturnRequest.findOne({ fulfillmentId, status: { $ne: 'CANCELLED' } });
    if (existing) {
      throw new ApiError(400, 'A return request already exists for this fulfillment', ERROR_CODES.BAD_REQUEST);
    }

    // Validate quantities
    for (const retItem of items) {
      const origItem = fulfillment.items.find(
        (i) => i.productId.toString() === retItem.productId.toString()
      );
      if (!origItem) {
        throw new ApiError(400, `Item ${retItem.productId} is not part of this fulfillment`, ERROR_CODES.BAD_REQUEST);
      }
      if (retItem.quantity > origItem.pickedQuantity) {
        throw new ApiError(
          400,
          `Return quantity for ${origItem.name} cannot exceed picked quantity`,
          ERROR_CODES.BAD_REQUEST
        );
      }
    }

    const returnRequest = await ReturnRequest.create({
      orderId,
      fulfillmentId,
      customerId: actor._id,
      reason,
      items,
      status: 'REQUESTED',
    });

    // Update fulfillment status
    await fulfillmentStatusService.transitionFulfillmentStatus(
      fulfillment._id,
      'RETURN_REQUESTED',
      actor,
      `Return requested: ${reason}`
    );

    // Trigger Return Requested Notifications
    try {
      await notificationService.createNotification({
        userId: actor._id,
        title: 'Return Requested',
        message: `Your return request for order #${order.orderNumber} has been submitted.`,
        type: 'RETURN_REQUESTED',
        link: '/account/orders'
      }, { dedupeKey: `${returnRequest._id.toString()}:RETURN_REQUESTED` });

      const vendor = await Vendor.findById(fulfillment.vendorId);
      if (vendor && vendor.userId) {
        await notificationService.createNotification({
          userId: vendor.userId,
          title: 'Return Request Received',
          message: `A customer has requested a return for sub-order #${fulfillment.vendorOrderId}.`,
          type: 'RETURN_REQUESTED',
          link: '/vendor/dashboard'
        }, { dedupeKey: `${returnRequest._id.toString()}:VENDOR_RETURN_REQUESTED` });
      }

      const admins = await User.find({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] } });
      for (const admin of admins) {
        await notificationService.createNotification({
          userId: admin._id,
          title: 'New Return Request Review Required',
          message: `Return request #${returnRequest._id} has been submitted for Order #${order.orderNumber} and requires review.`,
          type: 'RETURN_REQUESTED',
          link: '/admin/fulfillment'
        }, { dedupeKey: `${returnRequest._id.toString()}:ADMIN_RETURN_REQUESTED:${admin._id}` });
      }
    } catch (err) {
      console.error('Failed to notify return request:', err);
    }

    return returnRequest;
  },

  async updateReturnStatus(returnRequestId, newStatus, adminNote, actor) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const returnRequest = await ReturnRequest.findById(returnRequestId).session(session);
      if (!returnRequest) {
        throw new ApiError(404, 'Return request not found', ERROR_CODES.NOT_FOUND);
      }

      const oldStatus = returnRequest.status;
      if (oldStatus === newStatus) {
        await session.abortTransaction();
        session.endSession();
        return returnRequest;
      }

      const allowed = {
        REQUESTED: ['APPROVED', 'REJECTED', 'CANCELLED'],
        APPROVED: ['PICKUP_PENDING', 'CANCELLED'],
        PICKUP_PENDING: ['RECEIVED', 'CANCELLED'],
        RECEIVED: ['COMPLETED'],
        REJECTED: [],
        COMPLETED: [],
        CANCELLED: [],
      };

      if (!allowed[oldStatus]?.includes(newStatus)) {
        throw new ApiError(
          400,
          `Invalid return request status transition from ${oldStatus} to ${newStatus}`,
          ERROR_CODES.BAD_REQUEST
        );
      }

      returnRequest.status = newStatus;
      returnRequest.adminNote = adminNote || returnRequest.adminNote;
      if (newStatus === 'APPROVED') returnRequest.approvedAt = new Date();
      if (newStatus === 'RECEIVED') returnRequest.receivedAt = new Date();
      if (newStatus === 'COMPLETED') returnRequest.resolvedAt = new Date();

      await returnRequest.save({ session });

      // Trigger status transition notifications
      try {
        if (newStatus === 'APPROVED') {
          await notificationService.createNotification({
            userId: returnRequest.customerId,
            title: 'Return Request Approved',
            message: `Your return request for Order #${returnRequest.orderId} has been approved.`,
            type: 'RETURN_APPROVED',
            link: '/account/orders'
          }, { session, dedupeKey: `${returnRequest._id.toString()}:RETURN_APPROVED` });
        }
      } catch (err) {
        console.error('Failed to notify return approval:', err);
      }

      const fulfillment = await Fulfillment.findById(returnRequest.fulfillmentId).session(session);
      if (fulfillment) {
        if (newStatus === 'REJECTED' || newStatus === 'CANCELLED') {
          // Revert to DELIVERED
          await fulfillmentStatusService.transitionFulfillmentStatus(
            fulfillment._id,
            'DELIVERED',
            actor,
            `Return request ${newStatus}. Reverted back to delivered.`,
            session
          );

          try {
            await notificationService.createNotification({
              userId: returnRequest.customerId,
              title: `Return Request ${newStatus}`,
              message: `Your return request for Order #${returnRequest.orderId} has been ${newStatus.toLowerCase()}. Reason: ${adminNote || 'not approved'}`,
              type: newStatus === 'REJECTED' ? 'RETURN_REJECTED' : 'RETURN_COMPLETED',
              link: '/account/orders'
            }, { session, dedupeKey: `${returnRequest._id.toString()}:${newStatus}` });
          } catch (err) {
            console.error('Failed to notify return status revert:', err);
          }
        } else if (newStatus === 'COMPLETED') {
          // Transition to RETURNED
          await fulfillmentStatusService.transitionFulfillmentStatus(
            fulfillment._id,
            'RETURNED',
            actor,
            'Return request completed.',
            session
          );

          // Restock items
          for (const item of returnRequest.items) {
            await Product.findByIdAndUpdate(item.productId, {
              $inc: { stock: item.quantity },
            }).session(session);
          }

          try {
            await notificationService.createNotification({
              userId: returnRequest.customerId,
              title: 'Return Request Completed',
              message: `Your return request for Order #${returnRequest.orderId} has been completed.`,
              type: 'RETURN_COMPLETED',
              link: '/account/orders'
            }, { session, dedupeKey: `${returnRequest._id.toString()}:RETURN_COMPLETED` });
          } catch (err) {
            console.error('Failed to notify return completion:', err);
          }
        }
      }

      await session.commitTransaction();
      session.endSession();

      return returnRequest;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  },

  async cancelOrder(orderId, actor) {
    const isReplicaSet = Boolean(
      mongoose.connection?.client?.topology?.description?.setName ||
      ['ReplicaSetWithPrimary', 'Sharded'].includes(mongoose.connection?.client?.topology?.description?.type)
    );

    let session = null;
    let inTransaction = false;
    if (isReplicaSet) {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
        inTransaction = true;
      } catch (_) {
        session = null;
        inTransaction = false;
      }
    }

    const opts = inTransaction ? { session } : {};

    try {
      let orderQuery = Order.findById(orderId);
      if (inTransaction) orderQuery = orderQuery.session(session);
      const order = await orderQuery;
      if (!order) {
        throw new ApiError(404, 'Order not found', ERROR_CODES.NOT_FOUND);
      }

      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(actor.role);
      if (!isAdmin && order.userId.toString() !== actor._id.toString()) {
        throw new ApiError(403, 'Access denied: You do not own this order', ERROR_CODES.FORBIDDEN);
      }

      // Check if order is already cancelled/refunded (idempotency guard)
      if (order.orderStatus === 'CANCELLED' || order.paymentStatus === 'REFUNDED') {
        if (inTransaction) {
          await session.abortTransaction();
          session.endSession();
        }
        return order;
      }

      // Check if order is eligible for cancellation
      if (['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED'].includes(order.orderStatus)) {
        throw new ApiError(400, 'Order is not in a cancellable state', ERROR_CODES.BAD_REQUEST);
      }

      const wasPaid = order.paymentStatus === 'PAID';

      // 1. Cancel all fulfillments
      let fulfillmentsQuery = Fulfillment.find({ orderId: order._id });
      if (inTransaction) fulfillmentsQuery = fulfillmentsQuery.session(session);
      const fulfillments = await fulfillmentsQuery;
      for (const f of fulfillments) {
        if (f.status !== 'CANCELLED') {
          await fulfillmentStatusService.transitionFulfillmentStatus(
            f._id,
            'CANCELLED',
            actor,
            'Order cancelled by customer',
            inTransaction ? session : null
          );
        }
      }

      // 2. Revert product stock decrements atomically
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity },
        }, opts);

        await StockTransaction.create([{
          productId: item.productId,
          orderId: order._id,
          quantityChange: item.quantity,
          transactionType: 'RETURN',
        }], opts);
      }

      // 3. Reverse Vendor Earnings & Platform Commission (CRIT-03)
      let subordersQuery = VendorOrder.find({ parentOrderId: order._id });
      if (inTransaction) subordersQuery = subordersQuery.session(session);
      const suborders = await subordersQuery;
      for (const suborder of suborders) {
        if (suborder.status !== 'CANCELLED') {
          suborder.status = 'CANCELLED';
          await suborder.save(opts);

          if (wasPaid && suborder.vendorEarning > 0) {
            // Debit Vendor balance
            const updatedVendor = await Vendor.findByIdAndUpdate(
              suborder.vendorId,
              {
                $inc: {
                  balance: -suborder.vendorEarning,
                  totalSales: -suborder.subtotal,
                },
              },
              { new: true, ...opts }
            );

            // Cancel on-hold settlement
            await VendorSettlement.updateMany(
              { suborderId: suborder._id, status: 'ON_HOLD' },
              { $set: { status: 'CANCELLED', rejectionReason: 'Order cancelled and refunded' } },
              opts
            );

            // Create VendorLedger double-entry reversal record
            await VendorLedger.create([{
              vendorId: suborder.vendorId,
              orderId: order._id,
              suborderId: suborder._id,
              transactionType: 'REFUND_REVERSAL',
              credit: 0,
              debit: suborder.vendorEarning,
              balanceSnapshot: updatedVendor?.balance || 0,
              description: `Earnings reversed for cancelled/refunded suborder ${suborder.subOrderNumber || suborder.publicSuborderId}`,
              referenceId: order.orderNumber,
            }], opts);

            // Create PlatformLedger double-entry reversal record
            if (suborder.platformCommission > 0) {
              let latestPlatformQuery = PlatformLedger.findOne().sort({ createdAt: -1 });
              if (inTransaction) latestPlatformQuery = latestPlatformQuery.session(session);
              const latestPlatform = await latestPlatformQuery;
              const currentBal = latestPlatform?.balanceSnapshot || 0;
              const nextBal = moneyUtils.subtractMoney(currentBal, suborder.platformCommission);

              await PlatformLedger.create([{
                transactionId: `PL-REF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
                type: 'REFUND_REVERSAL',
                sourceEntityType: 'ORDER',
                sourceEntityId: order._id.toString(),
                credit: 0,
                debit: suborder.platformCommission,
                balanceSnapshot: nextBal,
                description: `5% Platform commission reversed for cancelled order ${order.orderNumber}`,
                metadata: {
                  orderId: order._id,
                  vendorId: suborder.vendorId,
                  suborderId: suborder._id,
                  reversedCommission: suborder.platformCommission,
                },
              }], opts);
            }
          }
        }
      }

      // 4. Reverse purchase reward coins and restore redeemed coins
      let coinTxsQuery = CoinTransaction.find({
        referenceId: order.orderNumber,
        $or: [{ type: 'PURCHASE_REWARD' }, { source: 'PURCHASE_REWARD' }]
      });
      if (inTransaction) coinTxsQuery = coinTxsQuery.session(session);
      const coinTxs = await coinTxsQuery;
      for (const ctx of coinTxs) {
        await fairCoinService.debitCoins({
          userId: ctx.userId,
          amount: ctx.amount,
          type: 'DEBIT',
          source: 'PURCHASE_REWARD_REVERSAL',
          referenceId: order.orderNumber,
          description: `Reversal of purchase reward for cancelled order #${order.orderNumber}`,
        });
      }

      if (order.fairCoinsUsed > 0) {
        await fairCoinService.creditCoins({
          userId: order.userId,
          amount: order.fairCoinsUsed,
          type: 'BONUS',
          source: 'ORDER_CANCELLED_COIN_RESTORE',
          referenceId: order.orderNumber,
          description: `Restored ${order.fairCoinsUsed} Fair Coins from cancelled order #${order.orderNumber}`,
        });
      }

      // 5. Update Payment record to REFUNDED
      if (wasPaid) {
        await Payment.updateMany(
          { orderId: order._id },
          { $set: { status: 'REFUNDED', refundedAt: new Date() } },
          opts
        );
      }

      order.orderStatus = 'CANCELLED';
      if (wasPaid) {
        order.paymentStatus = 'REFUNDED';
      }
      await order.save(opts);

      // 6. Reverse commissions associated with the order
      let commissionsQuery = Commission.find({ orderId: order._id });
      if (inTransaction) commissionsQuery = commissionsQuery.session(session);
      const commissions = await commissionsQuery;
      for (const comm of commissions) {
        if (comm.status !== 'CANCELLED') {
          comm.status = 'CANCELLED';
          await comm.save(opts);

          try {
            await notificationService.createNotification({
              userId: comm.recipientUserId,
              title: 'Commission Reversed',
              message: `Your commission for Order #${order.orderNumber} has been reversed due to cancellation.`,
              type: 'COMMISSION_EARNED',
              link: '/account/commissions'
            }, { session: inTransaction ? session : null, dedupeKey: `${comm._id.toString()}:COMMISSION_REVERSED` });
          } catch (err) {
            console.error('Failed to notify commission reversal:', err);
          }
        }
      }

      if (inTransaction && session) {
        await session.commitTransaction();
        session.endSession();
      }

      return order;
    } catch (error) {
      if (inTransaction && session) {
        try { await session.abortTransaction(); } catch (_) {}
        session.endSession();
      }
      throw error;
    }
  },
};
