import { FulfillmentHub } from '../models/FulfillmentHub.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const createHub = asyncWrapper(async (req, res) => {
  const { name, code, type, territoryId, address, contact, operatingHours, capacity } = req.body;

  const existing = await FulfillmentHub.findOne({ code: code.toUpperCase() });
  if (existing) {
    throw new ApiError(400, 'Hub with this code already exists', ERROR_CODES.CONFLICT);
  }

  const hub = await FulfillmentHub.create({
    name,
    code: code.toUpperCase(),
    type,
    territoryId,
    address,
    contact,
    operatingHours,
    capacity,
    createdBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, hub, 'Fulfillment Hub created successfully'));
});

export const getHubs = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 10, search = '', status = '' } = req.query;
  const query = {};

  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const hubs = await FulfillmentHub.find(query)
    .populate('territoryId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await FulfillmentHub.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        hubs,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
      'Hubs retrieved successfully'
    )
  );
});

export const getHubById = asyncWrapper(async (req, res) => {
  const hub = await FulfillmentHub.findById(req.params.id).populate('territoryId');
  if (!hub) {
    throw new ApiError(404, 'Hub not found', ERROR_CODES.NOT_FOUND);
  }
  return res.status(200).json(new ApiResponse(200, hub, 'Hub retrieved successfully'));
});

export const updateHub = asyncWrapper(async (req, res) => {
  const hub = await FulfillmentHub.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!hub) {
    throw new ApiError(404, 'Hub not found', ERROR_CODES.NOT_FOUND);
  }
  return res.status(200).json(new ApiResponse(200, hub, 'Hub updated successfully'));
});

export const updateHubStatus = asyncWrapper(async (req, res) => {
  const { status } = req.body;
  const hub = await FulfillmentHub.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );
  if (!hub) {
    throw new ApiError(404, 'Hub not found', ERROR_CODES.NOT_FOUND);
  }
  return res.status(200).json(new ApiResponse(200, hub, `Hub status updated to ${status}`));
});
