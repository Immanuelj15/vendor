# Phase 1 Stabilization — FairKart / Babu Super Market

This document outlines all the critical stabilization changes, security updates, coupon system repairs, order status capabilities, and administrative management APIs introduced in Phase 1.

---

## 1. Problems Found & Bugs Fixed

### Spin Wheel Runtime Crash
- **Problem**: In `spinService.js`, the `User` model was referenced (to fetch the user's new coin balance) but never imported, causing a `ReferenceError` on any spin.
- **Fix**: Added `import { User } from '../models/User.js';` to the top of `server/src/services/spinService.js`.

### MLM Registration Rewards Inactivity
- **Problem**: The `processReferralRegistrationRewards` method in `mlmRewardService` was implemented but never called during registration in `authService.js`.
- **Fix**: Awaited `mlmRewardService.processReferralRegistrationRewards()` inside a `try-catch` block during registration, immediately after saving the user.
- **Duplicate Key Prevention**: Removed the manual creation of `Referral` records in `authService.js` because `mlmRewardService` automatically builds the multi-level tree (including Level 1) internally. Manual duplicate writes were causing Mongoose unique index violations.

### Coupon System Fixes
- **Problem**: Coupons were saving their code to the Cart, but no coupon discount amount calculation was implemented, resulting in zero discount on orders.
- **Fix**:
  - Implemented cart-wide subtotal calculations in `cartService.js`.
  - Added `recalculateCart` which validates the cart's applied coupon (status, expiry, usage limits, and minimum purchase constraints) and computes the active `discountAmount` (for both percentage and fixed coupons, honoring `maxDiscount`).
  - Added a backend check in `orderService.js` to verify the coupon discount at checkout, increment the coupon's usage count, deduct the discount from the order's grand total, and save the coupon info to the `Order` record.

### Inverted Product Price Display
- **Problem**: In `Products.jsx` and `ProductDetail.jsx`, the strikethrough was mistakenly placed on `discountPrice` instead of the original `price` when a discount was active.
- **Fix**: Fixed the price rendering markup to correctly render `discountPrice` as the primary active price and `price` as the line-through original price.

---

## 2. Security Hardening & Protection

### VENDOR Role Implementation
- **Problem**: The `VENDOR` role was absent from `ROLES` constants, and the vendor portal endpoints `/api/vendors/*` were unguarded. Any user could register, access dashboards, publish products, or request withdrawals.
- **Fix**:
  - Added `VENDOR: 'VENDOR'` to `server/src/constants/roles.js`.
  - Applied the existing `authorize` middleware role guards to all vendor routes.
  - Allowed general authenticated access only to `/register`, but restricted dashboards, product updates, and withdrawals to `VENDOR`, `ADMIN`, and `SUPER_ADMIN`.
  - Configured `vendorService.registerVendor` to default vendor registration applications to `PENDING` status.
  - Automatically promote the user's role to `VENDOR` upon vendor approval by an administrator.

### Ghost Vendor Auto-Creation Removal
- **Problem**: `vendorService.getVendorProfile` automatically created a mock vendor profile if one didn't exist for the authenticated user, bypassing registration and role requirements.
- **Fix**: Removed the auto-creation logic. Now throws a standard 404 ApiError if no profile exists, enforcing explicit registration.

### Client-Side Route Guards (Defensive UX)
- **Problem**: Front-end routes `/account/*`, `/vendor/*`, and `/admin/*` were completely unshielded, letting unauthenticated or unauthorized users access the screens and experience broken interfaces.
- **Fix**:
  - Created `client/src/routes/ProtectedRoute.jsx` utilizing the Redux auth state.
  - Enforces login redirect for unauthenticated routes and home redirect for unauthorized role access.
  - Wrapped all dashboards, wallets, orders, referrals, and admin panels inside `ProtectedRoute`.

### Fallback Secrets Removal
- **Problem**: Fallback development JWT secrets were allowed to be used even in production mode in `env.js`.
- **Fix**: Added a production check that explicitly throws a fatal startup error if `JWT_ACCESS_SECRET` or `JWT_REFRESH_SECRET` are missing in production mode.

### NoSQL Injection Protection
- **Problem**: Database was vulnerable to standard NoSQL injection queries (e.g. `$gt`).
- **Fix**: Installed and registered `express-mongo-sanitize` as global middleware in `server/src/app.js` after body parsers.

---

## 3. APIs Added or Updated

### Orders
- **`PUT /api/orders/:id/status`**
  - updates status (`CONFIRMED`, `PROCESSING`, `PACKED`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
  - Auth: Admin/Super Admin can update parent order or sub-orders. Vendor can only update their own sub-orders (`VendorOrder`). Users are blocked.
  - Propagates sub-order status updates up to the parent order if status matches.
  - Creates AuditLogs for administrative updates.

### Admin Panels
- **`GET /api/admin/users`**: List users with pagination, text search, role filters, and status filters. Sanitizes response fields.
- **`PUT /api/admin/users/:id/status`**: Activate or suspend users (blocks suspending SUPER_ADMIN).
- **`GET /api/admin/vendors`**: List vendors with status filter.
- **`PUT /api/admin/vendors/:id/status`**: Set vendor status (`PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`). Triggers user role promotion to `VENDOR` upon approval.
- **`GET /api/admin/products/pending`**: List products pending admin approval.
- **`PUT /api/admin/products/:id/status`**: Approve or reject products.

---

## 4. Tests Performed & Results

- **Database Seed**: Seed script executes without any errors.
- **Integration Test Execution**: All Phase 1 integration tests passed successfully with no MongoClient errors.
- **Frontend Build**: Vite production build succeeded with zero compilation errors.

---

## 5. Remaining Risks & Deferred Work (TODOs)

### TODO: Database Write Transaction Hardening
- **Location**: `orderService.createOrder()`
- **Risk**: Performs up to 7 sequential database writes (order save, sub-orders saves, stock decrements, coin debits, vendor balance adjustments, cart clears). If a mid-step failure occurs, it leaves inconsistent data.
- **Action**: Wrap the entire create order sequence in a Mongoose session transaction in the next database hardening phase.

### TODO: fairCoinBalance Dual-Write Removal
- **Location**: `User.fairCoinBalance` and `Wallet.balance`
- **Risk**: Keeping coin balances in two separate collections/fields exposes the platform to out-of-sync drift.
- **Action**: Standardize on `Wallet.balance` (or `User.fairCoinBalance` directly) and remove the duplicated field in a dedicated refactoring phase.
