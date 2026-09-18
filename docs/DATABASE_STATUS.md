# DATABASE STATUS REPORT — FairKart MongoDB
> Generated: 2026-08-25

---

## Connection Config

- Driver: Mongoose 8.4.1
- Connection String: mongodb://127.0.0.1:27017/fairkart (local dev)
- DB Name: fairkart
- Timeout: serverSelectionTimeoutMS: 5000
- Non-blocking startup: Yes — server boots even if DB is down

---

## Models and Schema Summary (26 models)

### User
Fields: name, email, phone, passwordHash, refreshTokenHash, role (SUPER_ADMIN/ADMIN/USER), status (ACTIVE/SUSPENDED/PENDING_VERIFICATION), referralCode (unique, 8 chars), referredBy (ref User), referralPath ([User refs]), fairCoinBalance, emailVerified, lastLoginAt
Indexes: email (unique), phone (sparse), referralCode (unique), referralPath, role, status
Methods: comparePassword(), generateReferralCode() static
Issues: fairCoinBalance duplicated in Wallet model

### Order
Fields: orderNumber (auto-generated), userId, items (embedded: productId, name, image, price, quantity, vendorId), shippingAddress, paymentMethod (RAZORPAY/COD/WALLET), paymentStatus, orderStatus, subtotal, total, fairCoinsRedeemed, fairCoinDiscount, couponCode, couponDiscount, vendorOrders ([VendorOrder refs])
Indexes: orderNumber (unique), userId, orderStatus, createdAt

### VendorOrder
Fields: subOrderNumber, parentOrderId, vendorId, items, vendorEarning, platformCommission, status, estimatedDelivery
Indexes: subOrderNumber (unique), parentOrderId, vendorId, status

### Product
Fields: name, slug (unique), sku (unique), description, price, discountPrice, stock, categoryId, brandId, vendorId, images ([URLs]), coinReward, status (PENDING_APPROVAL/APPROVED/REJECTED/DRAFT), tags, weight, dimensions, variants
Indexes: slug, sku, vendorId, categoryId, brandId, status, text index on (name, description, tags)

### Vendor
Fields: userId (unique), storeName, slug (unique), description, gstin, bankDetails, status (PENDING/APPROVED/REJECTED/SUSPENDED), commissionRate, balance, totalSales, totalWithdrawn, rating
Indexes: userId (unique), slug, status

### Cart
Fields: userId (unique), items ([productId, quantity, price, vendorId]), couponCode, fairCoinsToRedeem, discountAmount, totalAmount
Issues: discountAmount is never set — coupon discount not calculated

### SpinWheel
Fields: title, description, isActive, dailySpinsPerUser, rewards ([title, type, value, probability, color])
Issues: No index — getActiveWheel does findOne({isActive: true})

### SpinHistory
Fields: userId, wheelId, segmentIndex, reward (embedded), coinsEarned
Indexes: userId, createdAt
Issues: Missing compound index (userId, wheelId, createdAt) for daily eligibility query

### CoinTransaction
Fields: userId, type (PURCHASE_REWARD/REFERRAL_BONUS/SPIN_REWARD/CHECKOUT_DEDUCTION/ADMIN_CREDIT/ADMIN_DEBIT/REGISTRATION_BONUS), amount, balanceAfter, source, description, referenceId (ref polymorphic), referenceModel
Indexes: userId, type, referenceId, createdAt
Issues: No TTL index — grows unboundedly

### Referral
Fields: userId, referredUserId, level (1/2/3), status (ACTIVE/INACTIVE), commissionEarned
Indexes: userId, referredUserId, level, compound unique on (userId, referredUserId)

### ReferralReward
Fields: userId, referralId, orderId, amount, type (REGISTRATION/PURCHASE), level, status (PENDING/PAID/CANCELLED)
Indexes: userId, referralId

### Commission
Fields: orderId, vendorId, recipientUserId, amount, type (VENDOR/MLM_L1/MLM_L2/MLM_L3), status, level, paidAt
Indexes: orderId, vendorId, recipientUserId

### Coupon
Fields: code (unique), type (PERCENTAGE/FIXED), value, minOrderValue, maxDiscount, expiresAt, isActive, usageLimit, usedCount, applicableCategories
Indexes: code (unique)

### Wallet
Fields: userId (unique), balance, totalEarned, totalSpent, currency
Issues: Duplicates fairCoinBalance on User model — risk of drift

### Notification
Fields: userId, title, message, type, isRead, data
Indexes: userId, isRead
Status: Model only — never dispatched or retrieved

### AuditLog
Fields: userId, action, resource, resourceId, changes, ipAddress, userAgent
Indexes: userId, action, createdAt
Issues: No TTL index — grows unboundedly

### Settings
Fields: key (unique), category, value (Mixed), isActive, updatedBy
Status: Works via updateSettings in adminService

### Campaign
Fields: title, description, type, multiplier, startDate, endDate, conditions, isActive
Status: Model only — never used in any service

### Payment
Fields: orderId, userId, transactionId (unique sparse), gateway (RAZORPAY/COD), amount, currency, status, gatewayResponse, failureReason
Indexes: orderId, userId, transactionId
Status: Model exists, paymentService exists — but no route, completely orphaned

### Category
Fields: name, slug (unique), description, parentCategory, isActive, image
Indexes: slug (unique)

### Brand
Fields: name, slug (unique), description, logo, isActive
Indexes: slug (unique)

### Review
Fields: productId, userId, rating (1-5), title, body, images, isVerifiedPurchase, helpfulCount, status
Indexes: productId, userId, compound unique (productId, userId), status
Status: Model only — never wired

### VendorWithdrawal
Fields: vendorId, amount, status (PENDING/APPROVED/REJECTED/PROCESSED), payoutDetails, processedAt, adminNote
Indexes: vendorId, status

### TeamMessage
Fields: senderUserId, title, message, targetLevel
Indexes: senderUserId

### Wishlist
Fields: userId (unique), products ([Product refs])
Indexes: userId (unique)
Status: Model only — never wired

### Role
Fields: name, description, permissions ([string])
Status: Created in seed but NEVER queried at runtime — RBAC uses string comparison on User.role field

---

## Data Relationships Summary

```
User ─── has one ──► Vendor (via vendorId)
User ─── has one ──► Wallet (via userId)
User ─── has one ──► Cart (via userId)
User ─── has one ──► Wishlist (via userId)
User ─── has many ──► Order (via userId)
User ─── has many ──► Referral (as referring user or referred user)
User ─── has many ──► CoinTransaction (via userId)
User ─── has many ──► SpinHistory (via userId)
User ─── has many ──► Notification (via userId)
User ─── has many ──► AuditLog (via userId)
User ─── has many ──► TeamMessage (via senderUserId)

Product ─── belongs to ──► Vendor
Product ─── belongs to ──► Category
Product ─── belongs to ──► Brand
Product ─── has many ──► Review

Order ─── has many ──► VendorOrder (sub-orders per vendor)
Order ─── has many ──► Commission (MLM + Vendor)
Order ─── has one ──► Payment
```

---

## Critical Database Fixes Required

1. ADD Mongoose transactions to orderService.createOrder() — multi-step write operation
2. REMOVE fairCoinBalance from User model OR Wallet model — stop dual-write, pick single source of truth
3. ADD TTL index: CoinTransaction.createdAt (e.g., 1 year) and AuditLog.createdAt (e.g., 2 years)
4. ADD compound index: SpinHistory({ userId: 1, wheelId: 1, createdAt: -1 })
5. ADD 'VENDOR' role to ROLES constant and User.role enum
6. REMOVE Role model from active code or implement proper permission lookup
