import { paymentService } from '../services/paymentService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

export const createPaymentOrder = asyncWrapper(async (req, res) => {
  const { orderId, subscriptionId, customerSubscriptionId } = req.body;
  const paymentPayload = await paymentService.createPaymentOrder({
    orderId,
    subscriptionId,
    customerSubscriptionId,
    userId: req.user._id,
  });
  return res.status(200).json(new ApiResponse(200, paymentPayload, 'Payment order created'));
});

export const verifyPaymentSignature = asyncWrapper(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const payment = await paymentService.verifyPaymentSignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });
  return res.status(200).json(new ApiResponse(200, { payment }, 'Payment verified and order fulfilled'));
});

export const getPaymentById = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const payment = await paymentService.getPaymentById(id, req.user);
  return res.status(200).json(new ApiResponse(200, { payment }, 'Payment record retrieved'));
});

export const handleWebhook = asyncWrapper(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.rawBody || '';
  const result = await paymentService.handleWebhook(rawBody, signature);
  return res.status(200).json(new ApiResponse(200, result, 'Webhook processed successfully'));
});
