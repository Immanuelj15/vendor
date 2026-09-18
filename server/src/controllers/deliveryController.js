import { deliveryService } from '../services/deliveryService.js';
import { DeliveryAssignment } from '../models/DeliveryAssignment.js';
import { DeliveryPartner } from '../models/DeliveryPartner.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const registerDeliveryPartner = asyncWrapper(async (req, res) => {
  const partner = await deliveryService.registerDeliveryPartner(req.body);
  return res.status(201).json(new ApiResponse(201, partner, 'Delivery partner registered successfully'));
});

export const assignDelivery = asyncWrapper(async (req, res) => {
  const { fulfillmentId } = req.params;
  const { deliveryPartnerId } = req.body;
  const assignment = await deliveryService.assignDelivery(fulfillmentId, deliveryPartnerId, req.user);
  return res.status(200).json(new ApiResponse(200, assignment, 'Delivery assignment created successfully'));
});

export const getMyDeliveries = asyncWrapper(async (req, res) => {
  const partner = await DeliveryPartner.findOne({ userId: req.user._id });
  if (!partner) {
    throw new ApiError(404, 'Delivery partner profile not found', ERROR_CODES.NOT_FOUND);
  }

  const assignments = await DeliveryAssignment.find({
    deliveryPartnerId: partner._id,
    status: { $nin: ['DELIVERED', 'CANCELLED'] }
  })
    .populate('fulfillmentId')
    .populate('packageId')
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, { assignments }, 'Assigned deliveries retrieved successfully'));
});

export const updateAssignmentStatus = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { status, recipientName, deliveryNote, failureReason } = req.body;
  const result = await deliveryService.updateAssignmentStatus(id, status, req.user, {
    recipientName,
    deliveryNote,
    failureReason,
  });
  return res.status(200).json(new ApiResponse(200, result, `Delivery status updated to ${status}`));
});
