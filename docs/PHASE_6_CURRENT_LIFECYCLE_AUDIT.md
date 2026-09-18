# Phase 6 Current Lifecycle Audit

This document summarizes the state of the KYC, subscription, shop activation, and renewal lifecycles in the Babu Super Market / FairKart codebase before the implementation of Phase 6.

## 1. Audit Findings (Task 1 Questions)

### 1. Which KYC fields already exist
The `KYCDocument` model contains the following fields:
- `ownerUserId`: ObjectId referencing `User` (required)
- `entityType`: String enum `['FRANCHISE', 'SHOPKEEPER', 'SHOP']` (required)
- `entityId`: ObjectId (required)
- `documentType`: String enum `['PAN', 'AADHAAR', 'GST', 'TRADE_LICENSE']` (required)
- `documentNumber`: String (required)
- `documentUrl`: String (required)
- `status`: String enum `['PENDING', 'VERIFIED', 'REJECTED']` (default `'PENDING'`)
- `submittedAt`: Date (default `Date.now`)
- `reviewedAt`: Date
- `reviewedBy`: ObjectId referencing `User`
- `rejectionReason`: String

### 2. Which subscription fields already exist
The `Subscription` model contains the following fields:
- `ownerUserId`: ObjectId referencing `User` (required)
- `entityType`: String enum `['FRANCHISE', 'SHOPKEEPER', 'SHOP']` (required)
- `entityId`: ObjectId (required)
- `planId`: ObjectId referencing `SubscriptionPlan` (required)
- `startDate`: Date (required)
- `endDate`: Date (required)
- `status`: String enum `['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED']` (default `'PENDING'`)
- `paymentId`: ObjectId referencing `Payment`
- `autoRenew`: Boolean (default `false`)
- `renewalCount`: Number (default `0`)
*(Note: `lastPaymentAt` and `cancelledAt` are currently missing and need to be added).*

The `SubscriptionPlan` model contains:
- `name`: String (required)
- `code`: String (required, unique, uppercase)
- `description`: String
- `price`: Number (required)
- `durationDays`: Number (required, default `365`)
- `applicableEntityType`: String enum `['FRANCHISE', 'SHOPKEEPER', 'SHOP']` (required)
- `features`: Array of Strings
- `isActive`: Boolean (default `true`)

### 3. Which payment fields already exist
The `Payment` model contains:
- `orderId`: ObjectId referencing `Order` (required)
- `userId`: ObjectId referencing `User` (required)
- `paymentMethod`: String enum `['RAZORPAY', 'STRIPE', 'COD']` (required)
- `transactionId`: String (required, unique)
- `amount`: Number (required)
- `currency`: String (default `'INR'`)
- `status`: String enum `['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CREATED', 'AUTHORIZED', 'CAPTURED']`
- `razorpayOrderId`: String
- `razorpayPaymentId`: String
- `failureReason`: String
- `verifiedAt`: Date
- `gatewaySignature`: String
- `gatewayRawResponse`: Mixed

### 4. Whether subscription payment is already integrated
- **No**. Currently, the subscription service has stub methods `activateSubscription` and `renewSubscription` which take a mock or custom string `paymentId`. However, they are not integrated with `Payment` creation, the Razorpay gateway, or signature verification. The backend does not verify payment status, amount, or gateway authenticity for subscriptions.

### 5. Whether shop activation already checks KYC
- **Partially**: When a shop is *created* via `createShop(operatorUser, data)`, the service checks if `shopkeeper.onboardingStatus === 'SUBSCRIBED'`. Since onboarding status only transitions to `KYC_APPROVED` when KYC is verified (and then to `SUBSCRIBED` when a subscription is activated), creation requires KYC verification.
- **No, for status transitions**: The `updateShopStatus(operatorUser, shopId, status)` method directly saves the status (e.g., `'ACTIVE'`) without checking whether the shopkeeper's KYC is `VERIFIED`/`APPROVED` or if any other prerequisites are satisfied.

### 6. Whether shop activation already checks subscription
- **No**. The `updateShopStatus` method does not verify if there is an `ACTIVE` subscription associated with the shop or shopkeeper before changing the status to `'ACTIVE'`.

### 7. Whether QR activation is linked to shop status
- **Yes**: In `attributeCustomerQR(customerId, publicToken)`, the service fetches the shop associated with the QR code and throws a `400` error if `shop.status !== 'ACTIVE'`. Thus, the ability to link new customers is blocked if the shop status is suspended, inactive, or expired.

### 8. Existing status enums
- **Shop / Shopkeeper**: `['PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE', 'EXPIRED']`
- **Franchise**: `['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED', 'EXPIRED', 'TERMINATED']`
- **KYCDocument**: `['PENDING', 'VERIFIED', 'REJECTED']`
- **Subscription**: `['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED']`
- **Shopkeeper Onboarding**: `['PENDING', 'KYC_SUBMITTED', 'KYC_APPROVED', 'SUBSCRIBED', 'APPROVED']`

### 9. Existing admin approval workflow
- Admins can approve or reject KYC documents via `reviewKyc(adminUser, kycId, status, rejectionReason)`.
- Admins or operators can update shop status using `updateShopStatus(operatorUser, shopId, status)`.
- There is no automated job or check that updates shop status to `EXPIRED` or `INACTIVE` when their subscription expires.
