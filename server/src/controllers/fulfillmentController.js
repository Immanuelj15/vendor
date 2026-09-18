import { fulfillmentService } from '../services/fulfillmentService.js';
import { fulfillmentStatusService } from '../services/fulfillmentStatusService.js';
import { Fulfillment } from '../models/Fulfillment.js';
import { Order } from '../models/Order.js';
import { VendorOrder } from '../models/VendorOrder.js';
import { Package } from '../models/Package.js';
import { DeliveryAssignment } from '../models/DeliveryAssignment.js';
import { OrderStatusHistory } from '../models/OrderStatusHistory.js';
import { Vendor } from '../models/Vendor.js';
import { Shopkeeper } from '../models/Shopkeeper.js';
import { Shop } from '../models/Shop.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const pickFulfillmentItems = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { items } = req.body; // array of { productId, pickedQuantity }
  const result = await fulfillmentService.pickItems(id, items, req.user);
  return res.status(200).json(new ApiResponse(200, result, 'Fulfillment picking updated successfully'));
});

export const packFulfillment = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { weight, dimensions } = req.body;
  const result = await fulfillmentService.packFulfillment(id, { weight, dimensions }, req.user);
  return res.status(200).json(new ApiResponse(200, result, 'Fulfillment packed successfully'));
});

export const receiveFulfillmentAtHub = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { hubId } = req.body;
  const result = await fulfillmentService.receiveAtHub(id, hubId, req.user);
  return res.status(200).json(new ApiResponse(200, result, 'Fulfillment received at Hub successfully'));
});

export const getAdminFulfillments = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 10, status = '', hubId = '', vendorId = '', shopId = '' } = req.query;
  const query = {};
  if (status) query.status = status;
  if (hubId) query.hubId = hubId;
  if (vendorId) {
    query.sourceType = 'VENDOR';
    query.sourceId = vendorId;
  }
  if (shopId) {
    query.sourceType = 'SHOP';
    query.sourceId = shopId;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const fulfillments = await Fulfillment.find(query)
    .populate('orderId')
    .populate('vendorOrderId')
    .populate('hubId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Fulfillment.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        fulfillments,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
      'Admin fulfillments retrieved successfully'
    )
  );
});

export const getAdminOrders = asyncWrapper(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status = '',
    paymentStatus = '',
    vendorId = '',
    shopId = '',
    date = '',
    orderNumber = '',
  } = req.query;
  const query = {};
  if (status) query.orderStatus = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (orderNumber) query.orderNumber = { $regex: orderNumber, $options: 'i' };
  if (shopId) query.attributedShopId = shopId;
  if (vendorId) {
    query['items.vendorId'] = vendorId;
  }
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    query.createdAt = { $gte: start, $lt: end };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const orders = await Order.find(query)
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Order.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        orders,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
      'Admin orders retrieved successfully'
    )
  );
});

export const getVendorFulfillments = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 10, status = '' } = req.query;
  const vendor = await Vendor.findOne({ userId: req.user._id });
  if (!vendor) {
    throw new ApiError(404, 'Vendor profile not found', ERROR_CODES.NOT_FOUND);
  }

  const query = { sourceType: 'VENDOR', sourceId: vendor._id };
  if (status) query.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const fulfillments = await Fulfillment.find(query)
    .populate('orderId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Fulfillment.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        fulfillments,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
      'Vendor fulfillments retrieved successfully'
    )
  );
});

export const getShopkeeperFulfillments = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 10, status = '' } = req.query;
  const shopkeeper = await Shopkeeper.findOne({ userId: req.user._id });
  if (!shopkeeper) {
    throw new ApiError(404, 'Shopkeeper profile not found', ERROR_CODES.NOT_FOUND);
  }
  const shop = await Shop.findOne({ shopkeeperId: shopkeeper._id });
  if (!shop) {
    throw new ApiError(404, 'Shop not found for this shopkeeper', ERROR_CODES.NOT_FOUND);
  }

  const query = { sourceType: 'SHOP', sourceId: shop._id };
  if (status) query.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const fulfillments = await Fulfillment.find(query)
    .populate('orderId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Fulfillment.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        fulfillments,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
      'Shopkeeper fulfillments retrieved successfully'
    )
  );
});

export const getCustomerOrderTracking = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, 'Order not found', ERROR_CODES.NOT_FOUND);
  }
  if (order.userId.toString() !== req.user._id.toString() && !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
    throw new ApiError(403, 'Access denied: You do not own this order', ERROR_CODES.FORBIDDEN);
  }

  const fulfillments = await Fulfillment.find({ orderId: order._id });
  const fulfillmentIds = fulfillments.map((f) => f._id);

  const packages = await Package.find({ fulfillmentId: { $in: fulfillmentIds } });

  const assignments = await DeliveryAssignment.find({ fulfillmentId: { $in: fulfillmentIds } }).populate(
    'deliveryPartnerId',
    'name'
  );

  const history = await OrderStatusHistory.find({ orderId: order._id }).sort({ timestamp: 1 });

  const safeAssignments = assignments.map((a) => ({
    status: a.status,
    deliveryPartner: {
      name: a.deliveryPartnerId?.name,
    },
    assignedAt: a.assignedAt,
    outForDeliveryAt: a.outForDeliveryAt,
    deliveredAt: a.deliveredAt,
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        fulfillments: fulfillments.map((f) => ({
          _id: f._id,
          status: f.status,
          items: f.items,
        })),
        packages: packages.map((p) => ({
          trackingNumber: p.trackingNumber,
          status: p.status,
        })),
        deliveries: safeAssignments,
        timeline: history.map((h) => ({
          status: h.status,
          note: h.note,
          timestamp: h.timestamp,
        })),
      },
      'Customer tracking details retrieved successfully'
    )
  );
});

export const getFulfillmentDetails = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const fulfillment = await Fulfillment.findById(id)
    .populate('orderId')
    .populate('vendorOrderId')
    .populate('hubId');

  if (!fulfillment) {
    throw new ApiError(404, 'Fulfillment not found', ERROR_CODES.NOT_FOUND);
  }

  if (req.user.role === 'VENDOR') {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor || fulfillment.sourceType !== 'VENDOR' || fulfillment.sourceId.toString() !== vendor._id.toString()) {
      throw new ApiError(403, 'Access denied', ERROR_CODES.FORBIDDEN);
    }
  } else if (req.user.role === 'SHOPKEEPER') {
    const shopkeeper = await Shopkeeper.findOne({ userId: req.user._id });
    const shop = await Shop.findOne({ shopkeeperId: shopkeeper?._id });
    if (!shop || fulfillment.sourceType !== 'SHOP' || fulfillment.sourceId.toString() !== shop._id.toString()) {
      throw new ApiError(403, 'Access denied', ERROR_CODES.FORBIDDEN);
    }
  }

  const pkg = await Package.findOne({ fulfillmentId: id });
  const assignments = await DeliveryAssignment.find({ fulfillmentId: id }).populate('deliveryPartnerId');
  const history = await OrderStatusHistory.find({ fulfillmentId: id }).sort({ timestamp: 1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        fulfillment,
        package: pkg,
        assignments,
        history,
      },
      'Fulfillment details retrieved successfully'
    )
  );
});
