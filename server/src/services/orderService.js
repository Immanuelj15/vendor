import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { VendorOrder } from '../models/VendorOrder.js';
import { Product } from '../models/Product.js';
import { Cart } from '../models/Cart.js';
import { Vendor } from '../models/Vendor.js';
import { UserAddress } from '../models/UserAddress.js';
import { StockTransaction } from '../models/StockTransaction.js';
import { CustomerShopAttribution } from '../models/CustomerShopAttribution.js';
import { VendorLedger } from '../models/VendorLedger.js';
import { PlatformLedger } from '../models/PlatformLedger.js';
import { Settings } from '../models/Settings.js';
import { fairCoinService } from './fairCoinService.js';
import { mlmRewardService } from './mlmRewardService.js';
import { priceService } from './priceService.js';
import { couponService } from './couponService.js';
import { cartService } from './cartService.js';
import { moneyUtils } from '../utils/moneyUtils.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const orderService = {
  async createOrder(userId, { shippingAddressId, shippingAddress, paymentMethod = 'RAZORPAY', fairCoinsToRedeem = 0 }) {
    // 1. Get raw cart
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, 'Your cart is empty', ERROR_CODES.BAD_REQUEST);
    }

    // 2. Fetch the delivery address snapshot
    let addressSnapshot = null;
    if (shippingAddressId) {
      const addressDoc = await UserAddress.findOne({ _id: shippingAddressId, userId });
      if (!addressDoc) throw new ApiError(400, 'Invalid delivery address selected', ERROR_CODES.BAD_REQUEST);
      addressSnapshot = addressDoc.toObject();
      delete addressSnapshot._id;
      delete addressSnapshot.__v;
    } else if (shippingAddress) {
      addressSnapshot = shippingAddress;
    } else {
      throw new ApiError(400, 'Delivery address is required', ERROR_CODES.BAD_REQUEST);
    }

    const orderNumber = `FK${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
    const publicOrderId = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 3. Calculate items and validate stock strictly inside transaction
      let itemsSubtotal = 0;
      const items = [];
      const itemsByVendor = {};

      for (const item of cart.items) {
        // Fetch product with session to lock/ensure latest state
        const prod = await Product.findById(item.productId._id || item.productId).session(session).populate('vendorId');
        
        if (!prod || prod.status !== 'APPROVED') {
          throw new ApiError(400, `Product is no longer available: ${prod?.name || 'Item'}`, ERROR_CODES.BAD_REQUEST);
        }

        const vStatus = prod.vendorId?.status;
        if (!prod.vendorId || (vStatus !== 'APPROVED' && vStatus !== 'ACTIVE')) {
          throw new ApiError(400, `Vendor for ${prod.name} is currently not eligible to sell`, ERROR_CODES.BAD_REQUEST);
        }

        const pricing = priceService.getEffectiveProductPrice(prod, item.variantSku);
        
        if (item.price !== pricing.sellingPrice) {
          throw new ApiError(
            400,
            `Prices have changed for some items (e.g. ${prod.name}). Please review your cart.`,
            ERROR_CODES.BAD_REQUEST
          );
        }

        if (pricing.stock < item.quantity) {
          throw new ApiError(400, `Insufficient stock for product: ${prod.name}`, ERROR_CODES.BAD_REQUEST);
        }

        const lineTotal = pricing.sellingPrice * item.quantity;
        itemsSubtotal += lineTotal;

        const vendorIdStr = prod.vendorId._id.toString();
        const vendorData = prod.vendorId;

        const orderItem = {
          productId: prod._id,
          vendorId: prod.vendorId._id,
          name: prod.name,
          productNameSnapshot: prod.name,
          skuSnapshot: prod.sku,
          price: pricing.sellingPrice,
          unitPrice: pricing.sellingPrice,
          quantity: item.quantity,
          taxSnapshot: prod.taxRate || 0,
          discountSnapshot: pricing.discountAmount || 0,
          lineTotal,
          variantSku: item.variantSku,
          image: prod.images?.[0] || '',
          productImageSnapshot: prod.images?.[0] || '',
        };

        items.push(orderItem);

        if (!itemsByVendor[vendorIdStr]) {
          itemsByVendor[vendorIdStr] = {
            vendorId: prod.vendorId._id,
            vendorNameSnapshot: vendorData.storeName || 'Vendor',
            businessNameSnapshot: vendorData.businessName || 'Business',
            items: [],
            vendorSubtotal: 0
          };
        }
        itemsByVendor[vendorIdStr].items.push(orderItem);
        itemsByVendor[vendorIdStr].vendorSubtotal += lineTotal;
      }

      // 4. Handle Coupon discount verification
      let discountTotal = 0;
      let targetCouponId = null;
      if (cart.couponCode) {
        const validation = await couponService.validateCoupon({
          code: cart.couponCode,
          userId,
          items: cart.items,
        });

        if (cart.discountAmount !== validation.discountAmount) {
          throw new ApiError(
            400,
            'Coupon discount has changed. Please review your cart.',
            ERROR_CODES.BAD_REQUEST
          );
        }
        discountTotal = validation.discountAmount;
        targetCouponId = validation.coupon._id;
      }

      // 5. Handle Fair Coins redemption discount
      let coinDiscount = 0;
      if (fairCoinsToRedeem > 0) {
        coinDiscount = Math.floor(fairCoinsToRedeem / 10);
      }

      const shippingTotal = 0; // Future module compatibility
      const taxTotal = 0; // Future module compatibility
      const grandTotal = Math.max(0, itemsSubtotal + taxTotal + shippingTotal - discountTotal - coinDiscount);

      const attribution = await CustomerShopAttribution.findOne({ customerUserId: userId, status: 'ACTIVE' });
      const customerAttributionId = attribution ? attribution._id : null;
      const attributedShopId = attribution ? attribution.shopId : null;

      const normalizedAddress = {
        name: addressSnapshot.name || addressSnapshot.recipientName || '',
        phone: addressSnapshot.phone || '',
        street: addressSnapshot.street || addressSnapshot.streetAddress || addressSnapshot.addressLine1 || '',
        streetAddress: addressSnapshot.streetAddress || addressSnapshot.street || addressSnapshot.addressLine1 || '',
        city: addressSnapshot.city || '',
        state: addressSnapshot.state || '',
        zip: addressSnapshot.zip || addressSnapshot.postalCode || '',
        postalCode: addressSnapshot.postalCode || addressSnapshot.zip || '',
        country: addressSnapshot.country || 'India',
      };

      // 6. Create Master Order
      const parentOrder = await Order.create([{
        orderNumber,
        publicOrderId,
        userId,
        items,
        shippingAddress: normalizedAddress, // backward compat
        billingAddress: normalizedAddress, // backward compat
        deliveryAddressSnapshot: addressSnapshot,
        subtotal: itemsSubtotal,
        itemsSubtotal,
        discount: discountTotal,
        discountTotal,
        coinDiscount,
        fairCoinsUsed: fairCoinsToRedeem,
        shippingFee: shippingTotal,
        shippingTotal,
        tax: taxTotal,
        taxTotal,
        total: grandTotal,
        grandTotal,
        paymentMethod,
        paymentStatus: 'PENDING',
        orderStatus: paymentMethod === 'COD' ? 'CONFIRMED' : 'PENDING',
        couponCode: cart.couponCode || '',
        customerAttributionId,
        attributedShopId, // backward compat
      }], { session });

      const masterOrder = parentOrder[0];

      // 7. Post-order processing for COD immediately
      if (paymentMethod === 'COD') {
        if (targetCouponId) {
          // A real implementation might need session support in incrementUsageAtomic
          await couponService.incrementUsageAtomic(targetCouponId);
        }

        if (fairCoinsToRedeem > 0) {
          // Also might need session
          await fairCoinService.debitCoins({
            userId,
            amount: fairCoinsToRedeem,
            type: 'DEBIT',
            source: 'ORDER_CHECKOUT_REDEMPTION',
            description: `Redeemed ${fairCoinsToRedeem} Fair Coins for order discount`,
            referenceId: orderNumber,
          });
        }

        let vendorIndex = 1;
        // Split Multi-Vendor Sub-Orders
        for (const [vId, vData] of Object.entries(itemsByVendor)) {
          
          const vendor = await Vendor.findById(vId).session(session);
          const platformSetting = await Settings.findOne({ key: 'PLATFORM_COMMISSION_PERCENT' }).session(session);
          const commissionRate = platformSetting?.value !== undefined ? Number(platformSetting.value) : (vendor?.commissionRate || 5);
          const platformCommission = moneyUtils.calculatePercentage(vData.vendorSubtotal, commissionRate);
          const vendorEarning = moneyUtils.subtractMoney(vData.vendorSubtotal, platformCommission);
          
          const suborderNum = `${publicOrderId}-V${String(vendorIndex).padStart(2, '0')}`;

          const subOrder = await VendorOrder.create([{
            publicSuborderId: suborderNum,
            subOrderNumber: suborderNum,
            parentOrderId: masterOrder._id,
            vendorId: vId,
            vendorNameSnapshot: vData.vendorNameSnapshot,
            businessNameSnapshot: vData.businessNameSnapshot,
            userId,
            items: vData.items,
            subtotal: vData.vendorSubtotal,
            itemsSubtotal: vData.vendorSubtotal,
            taxTotal: 0,
            discountTotal: 0,
            shippingTotal: 0,
            grandTotal: vData.vendorSubtotal,
            platformCommission,
            vendorEarning,
            status: 'CONFIRMED',
          }], { session });

          vendorIndex++;

          // 1. Update Vendor balance and total sales
          const updatedVendor = await Vendor.findByIdAndUpdate(
            vId,
            {
              $inc: {
                balance: vendorEarning,
                totalSales: vData.vendorSubtotal,
              },
            },
            { session, new: true }
          );

          // 2. Write double-entry Vendor Ledger record
          await VendorLedger.create([{
            vendorId: vId,
            orderId: masterOrder._id,
            suborderId: subOrder[0]._id,
            transactionType: 'SALE',
            credit: vendorEarning,
            debit: 0,
            balanceSnapshot: updatedVendor?.balance || vendorEarning,
            description: `Earning from order ${suborderNum} (95% net payout after 5% platform commission)`,
            referenceId: masterOrder.orderNumber,
          }], { session });

          // 3. Write double-entry Platform Ledger record
          const latestPlatformRecord = await PlatformLedger.findOne().sort({ createdAt: -1 }).session(session);
          const currentPlatformBalance = latestPlatformRecord?.balanceSnapshot || 0;
          const nextPlatformBalance = moneyUtils.addMoney(currentPlatformBalance, platformCommission);

          await PlatformLedger.create([{
            transactionId: `PL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
            type: 'ORDER_COMMISSION',
            sourceEntityType: 'ORDER',
            sourceEntityId: masterOrder._id.toString(),
            credit: platformCommission,
            debit: 0,
            balanceSnapshot: nextPlatformBalance,
            description: `5% Platform Commission from Order ${suborderNum} (Vendor: ${vData.vendorNameSnapshot})`,
            metadata: {
              orderId: masterOrder._id,
              vendorId: vId,
              suborderId: subOrder[0]._id,
              grossAmount: vData.vendorSubtotal,
              commissionRate,
            },
          }], { session });

          // Reduce product stock atomically with concurrency lock & track history
          for (const item of vData.items) {
            const updatedProduct = await Product.findOneAndUpdate(
              {
                _id: item.productId,
                stock: { $gte: item.quantity },
                isDeleted: false,
                status: 'APPROVED',
              },
              {
                $inc: { stock: -item.quantity },
              },
              { session, new: true }
            );

            if (!updatedProduct) {
              throw new ApiError(
                400,
                `Insufficient stock for product "${item.productNameSnapshot || item.name || 'item'}". Only limited stock available.`,
                ERROR_CODES.BAD_REQUEST
              );
            }

            await StockTransaction.create([{
              productId: item.productId,
              orderId: masterOrder._id,
              suborderId: subOrder[0]._id,
              quantityChange: -item.quantity,
              transactionType: 'PURCHASE'
            }], { session });
          }
        }

        // Clear User Cart
        await Cart.findOneAndUpdate({ userId }, {
          $set: {
            items: [],
            couponCode: '',
            discountAmount: 0,
            fairCoinsUsed: 0,
            coinDiscountAmount: 0
          }
        }, { session });
      }

      await session.commitTransaction();
      session.endSession();

      if (paymentMethod === 'COD') {
        // Run non-critical background jobs outside transaction
        setTimeout(async () => {
          try {
            const { fulfillmentService } = await import('./fulfillmentService.js');
            await fulfillmentService.createFulfillmentForOrder(masterOrder._id);
            await fairCoinService.processPurchaseReward(userId, masterOrder.orderNumber, grandTotal);
            await mlmRewardService.processPurchaseCommission(userId, masterOrder._id, grandTotal);
          } catch (e) {
            console.error('Background order tasks failed', e);
          }
        }, 0);
      }

      return masterOrder;

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  },

  async getUserOrders(userId) {
    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
    for (const order of orders) {
      order.vendorSuborders = await VendorOrder.find({ parentOrderId: order._id }).select('publicSuborderId vendorNameSnapshot grandTotal status items').lean();
    }
    return orders;
  },

  async getOrderById(orderId, userId) {
    const order = await Order.findOne({ _id: orderId, userId }).lean();
    if (!order) throw new ApiError(404, 'Order not found', ERROR_CODES.NOT_FOUND);

    const vendorOrders = await VendorOrder.find({ parentOrderId: order._id }).lean();
    return { order, vendorOrders };
  },

  async updateOrderStatus(id, status, user, ip = '') {
    const validStatuses = [
      'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 
      'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 
      'RETURNED', 'REFUNDED'
    ];

    if (!validStatuses.includes(status)) {
      throw new ApiError(400, 'Invalid status value', ERROR_CODES.BAD_REQUEST);
    }

    const ALLOWED_ORDER_TRANSITIONS = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['PACKED', 'CANCELLED'],
      PACKED: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED'],
      OUT_FOR_DELIVERY: ['DELIVERED', 'PROCESSING', 'CANCELLED', 'RETURNED'],
      DELIVERED: ['RETURN_REQUESTED', 'RETURNED'],
      RETURN_REQUESTED: ['RETURNED', 'DELIVERED'],
      RETURNED: ['REFUNDED'],
      CANCELLED: [],
      REFUNDED: [],
    };

    let parentOrder = await Order.findById(id);
    let vendorOrder = await VendorOrder.findById(id);

    if (!parentOrder && !vendorOrder) {
      throw new ApiError(404, 'Order not found', ERROR_CODES.NOT_FOUND);
    }

    const currentStatus = parentOrder ? parentOrder.orderStatus : vendorOrder.status;

    // Idempotency: if already in desired status, return immediately
    if (currentStatus === status) {
      return parentOrder ? { order: parentOrder } : { vendorOrder };
    }

    const allowed = ALLOWED_ORDER_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(status)) {
      throw new ApiError(400, `Invalid order status transition from ${currentStatus} to ${status}`, ERROR_CODES.BAD_REQUEST);
    }

    const { AuditLog } = await import('../models/AuditLog.js');
    const { Vendor } = await import('../models/Vendor.js');
    const { SuborderStatusHistory } = await import('../models/SuborderStatusHistory.js');

    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);

    if (isAdmin) {
      if (parentOrder) {
        parentOrder.orderStatus = status;
        await parentOrder.save();

        const suborders = await VendorOrder.find({ parentOrderId: parentOrder._id });
        for (const so of suborders) {
          const oldStatus = so.status;
          so.status = status;
          await so.save();
          await SuborderStatusHistory.create({
            suborderId: so._id,
            previousStatus: oldStatus,
            newStatus: status,
            changedBy: user._id,
            reason: 'Admin bulk update'
          });
        }

        await AuditLog.create({
          userId: user._id,
          action: `ADMIN_UPDATE_ORDER_STATUS_${status}`,
          entity: 'Order',
          newValue: status,
          ipAddress: ip,
        });

        return { order: parentOrder };
      } else {
        const oldStatus = vendorOrder.status;
        vendorOrder.status = status;
        await vendorOrder.save();

        await SuborderStatusHistory.create({
          suborderId: vendorOrder._id,
          previousStatus: oldStatus,
          newStatus: status,
          changedBy: user._id,
          reason: 'Admin suborder update'
        });

        await AuditLog.create({
          userId: user._id,
          action: `ADMIN_UPDATE_VENDOR_ORDER_STATUS_${status}`,
          entity: 'VendorOrder',
          newValue: status,
          ipAddress: ip,
        });

        return { vendorOrder };
      }
    }

    if (user.role === 'VENDOR') {
      const vendorProfile = await Vendor.findOne({ userId: user._id });
      if (!vendorProfile) {
        throw new ApiError(403, 'Access denied: Vendor profile not found', ERROR_CODES.FORBIDDEN);
      }

      if (parentOrder) {
        vendorOrder = await VendorOrder.findOne({ parentOrderId: parentOrder._id, vendorId: vendorProfile._id });
        if (!vendorOrder) {
          throw new ApiError(403, 'Access denied: You do not have items in this order', ERROR_CODES.FORBIDDEN);
        }
      } else {
        if (vendorOrder.vendorId.toString() !== vendorProfile._id.toString()) {
          throw new ApiError(403, 'Access denied: You can only update your own vendor orders', ERROR_CODES.FORBIDDEN);
        }
      }

      const oldStatus = vendorOrder.status;
      vendorOrder.status = status;
      await vendorOrder.save();

      await SuborderStatusHistory.create({
        suborderId: vendorOrder._id,
        previousStatus: oldStatus,
        newStatus: status,
        changedBy: user._id,
        reason: 'Vendor status update'
      });

      const siblingSubOrders = await VendorOrder.find({ parentOrderId: vendorOrder.parentOrderId });
      const allHaveStatus = siblingSubOrders.every(so => so.status === status);
      if (allHaveStatus) {
        await Order.findByIdAndUpdate(vendorOrder.parentOrderId, { orderStatus: status });
      } else {
        const anyProcessing = siblingSubOrders.some(so => ['PROCESSING', 'PACKED', 'SHIPPED'].includes(so.status));
        if (anyProcessing) {
          await Order.findByIdAndUpdate(vendorOrder.parentOrderId, { orderStatus: 'PROCESSING' });
        }
      }

      return { vendorOrder };
    }

    throw new ApiError(403, 'Access denied: Unauthorized to update order status', ERROR_CODES.FORBIDDEN);
  },
};
