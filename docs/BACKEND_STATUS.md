# BACKEND STATUS REPORT — FairKart Server
> Generated: 2026-08-25 | server/ directory

---

## Entry Points

| File | Status | Notes |
|------|--------|-------|
| server.js | WORKING | Starts HTTP server on PORT env var (default 5000), non-blocking DB connection |
| app.js | WORKING | Registers all middleware and route groups |
| config/env.js | WORKING | Zod-based env validation, fails fast on missing vars |
| config/db.js | WORKING | Mongoose connection with error + disconnection event listeners |
| routes/index.js | WORKING | Central route registry for all 11 API groups |

---

## Controllers (11 files)

| Controller | Endpoints | Status | Issues |
|-----------|-----------|--------|--------|
| authController.js | register, login, refreshToken, logout, getMe | WORKING | None |
| productController.js | getProducts, getProduct, createProduct (admin), createCategory | WORKING | createProduct not on any admin route |
| orderController.js | createOrder, getMyOrders, getOrderById | WORKING | No updateOrderStatus |
| cartController.js | getCart, addToCart, updateQuantity, applyCoupon | WORKING | applyCoupon stores code but no discount calc |
| referralController.js | getReferralLink, getReferralTree, sendTeamMessage, getTeamMessages | WORKING | None |
| fairCoinController.js | getWallet, getTransactions | WORKING | No credit/debit admin endpoints |
| spinController.js | getWheel, spin | BROKEN | spinService.js will crash — User not imported |
| vendorController.js | registerVendor, getVendorDashboard, createVendorProduct, requestWithdrawal | PARTIALLY BUILT | No VENDOR role guard |
| adminController.js | getAdminMetrics, updateSettings, getAuditLogs | PARTIALLY BUILT | No user/vendor management |
| healthController.js | getHealthStatus | WORKING | None |
| categoryController.js | (no dedicated file) | WORKING | createCategory inside productController |

---

## Services (10 files)

| Service | Functions | Status | Issues |
|---------|-----------|--------|--------|
| authService.js | register, login, refreshToken, logout, getMe | WORKING | Missing call to processReferralRegistrationRewards() |
| productService.js | getProducts, getProductBySlug, createProduct | WORKING | createProduct auto-approves all products |
| orderService.js | createOrder, getMyOrders, getOrderById | WORKING | No coupon discount applied, Razorpay not initiated |
| cartService.js | getCart, addToCart, updateQuantity, applyCoupon | PARTIALLY | Coupon code stored, discount never calculated |
| referralService.js | getReferralLink, buildReferralTree (3 levels + rank + leaderboard) | WORKING | None |
| fairCoinService.js | getOrCreateWallet, creditCoins, debitCoins, getTransactionHistory | WORKING | Dual-write to User + Wallet |
| spinService.js | getActiveWheel, checkEligibility, processSpin | BROKEN | ReferenceError: User is not defined on line 98 |
| vendorService.js | registerVendor, getVendorProfile (auto-creates ghost), getVendorDashboard, createVendorProduct, requestWithdrawal | PARTIALLY | Ghost vendor auto-creation, no VENDOR role |
| mlmRewardService.js | processReferralRegistrationRewards, processPurchaseCommission | PARTIALLY | processReferralRegistrationRewards is never called |
| paymentService.js | createPaymentOrder, verifyPaymentSignature | ORPHANED | No route, no controller imports this service |
| adminService.js | getAdminMetrics, updateSettings, getAuditLogs | WORKING | No user/vendor management |
| tokenService.js | generateTokens, verifyAndRotateRefreshToken | WORKING | Used by authService |

Note: tokenService.js is an extra service (11 total).

---

## Routes (12 files)

| Route File | Prefix | Auth | Role Guard | Issues |
|-----------|--------|------|-----------|--------|
| authRoutes.js | /api/auth | Partial | None | None |
| productRoutes.js | /api/products | None | None | Public listing ✅ |
| categoryRoutes.js | /api/categories | Partial | Admin for create | None |
| orderRoutes.js | /api/orders | Required | None | No status update route |
| cartRoutes.js | /api/cart | Required | None | None |
| referralRoutes.js | /api/referrals | Required | None | None |
| fairCoinRoutes.js | /api/fair-coins | Required | None | None |
| spinRoutes.js | /api/spin | Required | None | spinService crashes |
| vendorRoutes.js | /api/vendors | Required | NONE ← BUG | Any user can access |
| adminRoutes.js | /api/admin | Required | ADMIN/SUPER_ADMIN | No user/vendor mgmt |
| healthRoutes.js | /api/health | None | None | None |
| index.js | /api | — | — | Missing: /payments, /notifications, /wishlist, /reviews |

---

## Middleware (4 files)

| Middleware | Status | Notes |
|-----------|--------|-------|
| authMiddleware.js | WORKING | Bearer + cookie, suspended check |
| roleMiddleware.js | WORKING | authorize() factory |
| errorMiddleware.js | WORKING | Converts all errors to ApiError, dev stacks |
| validateMiddleware.js | WORKING | Zod schema wrapper |

---

## Validators (1 file)

| File | Schemas | Missing |
|------|---------|---------|
| authValidator.js | registerSchema, loginSchema, refreshTokenSchema | Cart, Order, Product, Vendor, Spin validators |

---

## Utils (4 files)

| Util | Status | Notes |
|------|--------|-------|
| ApiError.js | WORKING | Custom error class |
| ApiResponse.js | WORKING | Standard success response |
| asyncWrapper.js | WORKING | Async error catch wrapper |
| jwt.js | WORKING | 4 functions: generate + verify for access + refresh |

---

## Critical Backend Fixes Required

1. FIX spinService.js — add `import { User } from '../models/User.js';` to line 1
2. FIX authService.js — call `mlmRewardService.processReferralRegistrationRewards()` after successful registration
3. FIX constants/roles.js — add `VENDOR: 'VENDOR'` to ROLES
4. FIX vendorRoutes.js — add `authorize('VENDOR', 'ADMIN', 'SUPER_ADMIN')` middleware
5. FIX cartService.js — calculate discountAmount from coupon type/value
6. ADD /api/payments route connecting paymentService
7. ADD order status update route PUT /api/orders/:id/status
8. ADD admin user management routes
9. ADD admin vendor management routes
