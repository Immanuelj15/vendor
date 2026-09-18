import { returnService } from '../services/returnService.js';
import { ReturnRequest } from '../models/ReturnRequest.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

export const cancelOrder = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const order = await returnService.cancelOrder(id, req.user);
  return res.status(200).json(new ApiResponse(200, order, 'Order cancelled successfully'));
});

export const requestReturn = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { fulfillmentId, reason, items } = req.body;
  const returnRequest = await returnService.requestReturn(id, { fulfillmentId, reason, items }, req.user);
  return res.status(201).json(new ApiResponse(201, returnRequest, 'Return request submitted successfully'));
});

export const getReturnRequests = asyncWrapper(async (req, res) => {
  const { page = 1, limit = 10, status = '' } = req.query;
  const query = {};
  if (status) query.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const requests = await ReturnRequest.find(query)
    .populate('orderId')
    .populate('customerId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await ReturnRequest.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        requests,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
      'Return requests retrieved successfully'
    )
  );
});

export const updateReturnStatus = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { status, adminNote } = req.body;
  const result = await returnService.updateReturnStatus(id, status, adminNote, req.user);
  return res.status(200).json(new ApiResponse(200, result, `Return status updated to ${status}`));
});
