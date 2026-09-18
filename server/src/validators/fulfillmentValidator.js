import { z } from 'zod';

export const hubCreateSchema = z.object({
  name: z.string().min(2, 'Hub name must be at least 2 characters'),
  code: z.string().min(2, 'Hub code must be at least 2 characters').toUpperCase(),
  type: z.enum(['WAREHOUSE', 'DISTRIBUTION_HUB']),
  territoryId: z.string().min(1, 'Territory ID is required'),
  address: z.string().min(5, 'Address is required'),
  contact: z.object({
    name: z.string().min(2, 'Contact name is required'),
    phone: z.string().min(10, 'Contact phone is required'),
    email: z.string().email('Invalid email'),
  }),
  operatingHours: z.string().optional(),
  capacity: z.number().nonnegative().optional(),
});

export const hubStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    errorMap: () => ({ message: 'Status must be ACTIVE or INACTIVE' }),
  }),
});

export const fulfillmentStatusSchema = z.object({
  status: z.enum(
    [
      'PENDING',
      'PROCESSING',
      'PICKED',
      'PACKED',
      'READY_FOR_DISPATCH',
      'DISPATCHED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
      'RETURN_REQUESTED',
      'RETURNED',
    ],
    {
      errorMap: () => ({ message: 'Invalid fulfillment status' }),
    }
  ),
});

export const pickItemsSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'Product ID is required'),
        pickedQuantity: z.number().int().nonnegative('Quantity must be non-negative'),
      })
    )
    .min(1, 'At least one item must be picked'),
});

export const packFulfillmentSchema = z.object({
  weight: z.number().nonnegative().optional(),
  dimensions: z
    .object({
      length: z.number().nonnegative(),
      width: z.number().nonnegative(),
      height: z.number().nonnegative(),
    })
    .optional(),
});

export const deliveryAssignSchema = z.object({
  deliveryPartnerId: z.string().min(1, 'Delivery Partner ID is required'),
});

export const deliveryStatusSchema = z.object({
  status: z.enum(
    ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED'],
    {
      errorMap: () => ({ message: 'Invalid delivery status' }),
    }
  ),
  recipientName: z.string().optional(),
  deliveryNote: z.string().optional(),
  failureReason: z.string().optional(),
});

export const returnRequestSchema = z.object({
  fulfillmentId: z.string().min(1, 'Fulfillment ID is required'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'Product ID is required'),
        name: z.string().min(1, 'Product name is required'),
        quantity: z.number().int().positive('Quantity must be at least 1'),
      })
    )
    .min(1, 'At least one item must be returned'),
});

export const returnStatusSchema = z.object({
  status: z.enum(
    ['REQUESTED', 'APPROVED', 'REJECTED', 'PICKUP_PENDING', 'RECEIVED', 'COMPLETED', 'CANCELLED'],
    {
      errorMap: () => ({ message: 'Invalid return status' }),
    }
  ),
  adminNote: z.string().optional(),
});
