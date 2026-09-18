import { VendorShippingAddress } from '../models/VendorShippingAddress.js';
import { Shipment } from '../models/Shipment.js';
import { ShipmentTrackingEvent } from '../models/ShipmentTrackingEvent.js';
import { Vendor } from '../models/Vendor.js';
import { Order } from '../models/Order.js';
import { shippingService } from '../services/shippingService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

// VENDOR: Shipping Addresses
export const getVendorShippingAddresses = asyncWrapper(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id });
  if (!vendor) throw new ApiError(404, 'Vendor profile not found', ERROR_CODES.NOT_FOUND);

  const addresses = await VendorShippingAddress.find({ vendorId: vendor._id }).populate('state district area');
  return res.status(200).json(new ApiResponse(200, { addresses }, 'Shipping addresses retrieved'));
});

export const addVendorShippingAddress = asyncWrapper(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id });
  if (!vendor) throw new ApiError(404, 'Vendor profile not found', ERROR_CODES.NOT_FOUND);

  const payload = { ...req.body, vendorId: vendor._id };
  if (payload.isDefault) {
    await VendorShippingAddress.updateMany({ vendorId: vendor._id }, { isDefault: false });
  }

  const address = await VendorShippingAddress.create(payload);
  return res.status(201).json(new ApiResponse(201, { address }, 'Shipping address added'));
});

// VENDOR: Shipments
export const createShipment = asyncWrapper(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id });
  if (!vendor) throw new ApiError(404, 'Vendor profile not found', ERROR_CODES.NOT_FOUND);

  const { suborderId, weight, length, width, height, packageCount, providerName } = req.body;

  const shipment = await shippingService.createShipment(suborderId, vendor._id, { weight, length, width, height, packageCount, providerName });
  
  return res.status(201).json(new ApiResponse(201, { shipment }, 'Shipment created successfully'));
});

export const requestPickup = asyncWrapper(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id });
  if (!vendor) throw new ApiError(404, 'Vendor profile not found', ERROR_CODES.NOT_FOUND);

  const { id } = req.params;
  const { pickupDate } = req.body;

  const shipment = await shippingService.requestPickup(id, vendor._id, pickupDate);
  
  return res.status(200).json(new ApiResponse(200, { shipment }, 'Pickup requested successfully'));
});

export const getShipmentTracking = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  
  const shipment = await Shipment.findById(id);
  if (!shipment) throw new ApiError(404, 'Shipment not found', ERROR_CODES.NOT_FOUND);

  // Vendor Auth check
  if (req.user.role === 'VENDOR') {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor || shipment.vendorId.toString() !== vendor._id.toString()) {
      throw new ApiError(403, 'Forbidden', ERROR_CODES.FORBIDDEN);
    }
  }

  // Customer Auth check
  if (req.user.role === 'CUSTOMER') {
    const suborder = await import('../models/VendorOrder.js').then(m => m.VendorOrder.findById(shipment.suborderId));
    if (!suborder || suborder.userId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Forbidden', ERROR_CODES.FORBIDDEN);
    }
  }

  const trackingEvents = await ShipmentTrackingEvent.find({ shipmentId: id }).sort({ eventTime: -1 });
  
  return res.status(200).json(new ApiResponse(200, { shipment, trackingEvents }, 'Tracking information retrieved'));
});

// WEBHOOK
export const handleCourierWebhook = asyncWrapper(async (req, res) => {
  const { provider } = req.params;
  
  // Minimal secure mock validation would happen here
  await shippingService.handleWebhook(provider, req.body);
  
  return res.status(200).json(new ApiResponse(200, null, 'Webhook received'));
});
