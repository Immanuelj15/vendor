# Phase 2 Payment & Order Lifecycle — FairKart / Babu Super Market

This document outlines the design, architecture, security model, and implementation details of the production-ready Razorpay payment flow and order lifecycle verification.

---

## 1. End-to-End Payment Flow

The following sequence illustrates the secure checkout lifecycle:

```
Customer 
   ↓
[Selects items & checks out (Checkout.jsx)]
   ↓
[Server creates Order in PENDING status (POST /api/orders)]
   ↓
[Server creates Razorpay Order (POST /api/payments/create-order)]
   ↓
[Frontend loads Razorpay Checkout script & opens payment modal]
   ↓
[Customer pays successfully on gateway]
   ↓
[Frontend sends signature to backend (POST /api/payments/verify)]
   ↓
[Server Timing-Safe Verification & Capturing]
   ↓
[Order Status -> CONFIRMED, Payment Status -> PAID]
   ↓
[Fulfillment: Stock decremented, Cart cleared, MLM rewards, coins & commissions processed]
```

---

## 2. Payment & Order State Machine

### Razorpay Payments

```
ORDER CREATED (orderStatus: PENDING, paymentStatus: PENDING)
       ↓
PAYMENT PENDING (Payment record CREATED)
       ↓
RAZORPAY CHECKOUT (Client opens payment modal)
       ↓
PAYMENT VERIFIED (Signature verification timing-safe check)
       ↓
PAYMENT CAPTURED (Payment record CAPTURED, verifiedAt set)
       ↓
ORDER CONFIRMED (orderStatus: CONFIRMED, paymentStatus: PAID)
       ↓
Fulfillment (Sub-orders generated, stock reduced, cart cleared, rewards triggered)
```

### Cash on Delivery (COD)

COD remains completely independent of Razorpay:

```
ORDER CREATED (orderStatus: CONFIRMED, paymentStatus: PENDING)
       ↓
Fulfillment immediately (Stock reduced, cart cleared, rewards triggered)
```

---

## 3. Security Model & Protections

- **Server-Side Authorization**: Clients cannot trigger payments or verifications for orders they do not own. A 403 Forbidden is thrown if the user ID mismatches.
- **Payable Restrictions**: Orders already PAID or CANCELLED are rejected during payment generation.
- **Amount Security**: The final amount is loaded directly from the securely calculated `order.total` on the backend. Mismatches or arbitrary frontend amounts are ignored.
- **Timing-Safe Signature Check**: Validates the Razorpay HMAC signature using `crypto.timingSafeEqual`. Hashing both signatures with SHA-256 prevents string length RangeError mismatch exceptions.
- **Webhook Raw Body Access**: Captures `req.rawBody` within `express.json` middleware via a custom `verify` callback. This supports signature verification of webhook events without breaking global JSON parsing.

---

## 4. Idempotency Strategy

- **Signature Verification**: If a payment is already `CAPTURED` or `SUCCESS`, additional calls return the record immediately without repeating stock decrements or credits.
- **Double Credit/Debit Prevention**: MLM commissions, vendor sales adjustments, and Fair Coin transactions are tied to the order payment verification check, guaranteeing they execute exactly once per order.

---

## 5. Webhook Strategy

- **Endpoint**: `POST /api/payments/webhook` (no JWT authentication required).
- **Supported Events**:
  - `payment.captured` / `order.paid`: Captures payment and fulfills order.
  - `payment.failed`: Updates payment status to FAILED and order paymentStatus to FAILED.
- **Security**: Signature verified using the header `x-razorpay-signature` and `RAZORPAY_WEBHOOK_SECRET` configuration.

---

## 6. API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **POST** | `/api/payments/create-order` | User | Creates a Razorpay order from a pending Order. |
| **POST** | `/api/payments/verify` | User | Timing-safe verifies signature and fulfills order. |
| **GET** | `/api/payments/:id` | User/Admin | Retrieve payment status (owner or admin only). |
| **POST** | `/api/payments/webhook` | Webhook | Handles Razorpay background capture/failure events. |

---

## 7. Environment Variables

Configure `server/.env` with:

```env
RAZORPAY_KEY_ID=rzp_test_demo
RAZORPAY_KEY_SECRET=rzp_secret_demo
RAZORPAY_WEBHOOK_SECRET=rzp_webhook_demo
```

*Note: In development mode, dummy keys automatically fall back to mock Razorpay order generation to facilitate frontend testing without requiring live credentials.*

---

## 8. Integration Testing

To run the integration tests for Phase 2:

```bash
# In server directory
node scripts/testPhase2.js
```
