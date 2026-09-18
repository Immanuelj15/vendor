# Phase 7 Current Order Flow Audit

This document describes the state of order status, vendor orders, payment integration, stock decrement, vendor assignment, and delivery infrastructure in the Babu Super Market / FairKart codebase before the implementation of Phase 7 (Order Fulfillment + Hub/Warehouse + Delivery).

## 1. Audit Findings (Task 1 Questions)

### 1. Current Order Statuses
In the `Order` model, the `orderStatus` field is defined with the following enum:
- `PENDING` (Default)
- `CONFIRMED`
- `PROCESSING`
- `PACKED`
- `SHIPPED`
- `OUT_FOR_DELIVERY`
- `DELIVERED`
- `CANCELLED`
- `RETURN_REQUESTED`
- `RETURNED`
- `REFUNDED`

### 2. Current VendorOrder Statuses
In the `VendorOrder` model, the `status` field is defined with the following enum:
- `PENDING` (Default)
- `CONFIRMED`
- `PROCESSING`
- `PACKED`
- `SHIPPED`
- `DELIVERED`
- `CANCELLED`

### 3. Current Payment States
Payment states are managed in two places:
- **Order Model (`paymentStatus`)**: `['PENDING', 'PAID', 'FAILED', 'REFUNDED']` (Default: `PENDING`)
- **Payment Model (`status`)**: `['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CREATED', 'AUTHORIZED', 'CAPTURED']` (Default: `PENDING`)

### 4. Current Cancellation Logic
- There is currently no custom/restricted cancellation logic.
- In `orderService.js`, the `updateOrderStatus` method permits updating the status to any of the valid statuses (including `CANCELLED`) if the user is an `ADMIN`, `SUPER_ADMIN`, or `VENDOR` (for their own sub-orders).
- A customer cannot cancel or return their own order via the API since `updateOrderStatus` throws a `403 Forbidden` error if the role is not `ADMIN`, `SUPER_ADMIN`, or `VENDOR`.

### 5. Existing Stock Decrement
- Stock is decremented **immediately** when an order becomes `CONFIRMED`.
  - For Cash on Delivery (COD) orders: This happens during `orderService.createOrder`.
  - For online payments (Razorpay): This happens during payment verification in `paymentService.verifyPaymentSignature`.
- Stock is decremented by calling `Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } })`.
- There is no double-decrement prevention during fulfillment, meaning we must ensure that fulfillment actions do not decrement stock a second time.

### 6. Existing Vendor Assignment
- When an order is placed, items in the cart are grouped by `vendorId`.
- A separate `VendorOrder` is created for each unique vendor containing only their products.
- Each `VendorOrder` calculates its own `subtotal`, `platformCommission`, and `vendorEarning`, and is created with status `CONFIRMED`.

### 7. Existing shippingAddress
- The `shippingAddress` is stored directly on the `Order` document as a sub-document with the following structure:
  - `name`: String (Required)
  - `phone`: String (Required)
  - `street`: String (Required)
  - `city`: String (Required)
  - `state`: String (Required)
  - `zip`: String (Required)
  - `country`: String (Default: 'India')

### 8. Existing Order Tracking Fields
- Currently, tracking fields (e.g. tracking number, carrier, dispatch date, delivery logs) do not exist on the `Order` or `VendorOrder` models.
- There is no history log model to record who transitioned an order and when.

### 9. Existing Delivery-Related Models
- There are **no** delivery-related models in the database.
- The concepts of `Fulfillment`, `FulfillmentHub` / `Warehouse`, `Package`, `DeliveryPartner`, `DeliveryAssignment`, `ReturnRequest`, and `OrderStatusHistory` need to be implemented as new schemas.
