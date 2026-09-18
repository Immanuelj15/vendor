import { z } from 'zod';

export const createPaymentOrderSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
});

export const verifyPaymentSignatureSchema = z.object({
  razorpayOrderId: z.string().min(1, 'Razorpay Order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Razorpay Payment ID is required'),
  razorpaySignature: z.string().min(1, 'Razorpay Signature is required'),
});
