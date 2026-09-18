import { orderService } from '../services/orderService.js';
import { invoiceService } from '../services/invoiceService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

export const createOrder = asyncWrapper(async (req, res) => {
  const order = await orderService.createOrder(req.user._id, req.body);
  return res.status(201).json(new ApiResponse(201, { order }, 'Order created successfully'));
});

export const getMyOrders = asyncWrapper(async (req, res) => {
  const orders = await orderService.getUserOrders(req.user._id);
  return res.status(200).json(new ApiResponse(200, { orders }, 'Orders retrieved'));
});

export const getOrderById = asyncWrapper(async (req, res) => {
  const data = await orderService.getOrderById(req.params.id, req.user._id);
  return res.status(200).json(new ApiResponse(200, data, 'Order details retrieved'));
});

export const getOrderInvoice = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { html, invoiceNumber } = await invoiceService.generateInvoiceHtml(id, req.user);
  
  if (req.query.format === 'json') {
    return res.status(200).json(new ApiResponse(200, { html, invoiceNumber }, 'Invoice generated'));
  }
  
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', `inline; filename="${invoiceNumber}.html"`);
  return res.send(html);
});

export const updateOrderStatus = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const data = await orderService.updateOrderStatus(id, status, req.user, req.ip);
  return res.status(200).json(new ApiResponse(200, data, `Order status updated to ${status}`));
});

