# IMPLEMENTATION PLAN — FairKart Platform
> Generated: 2026-08-25 | Priority-ordered fix and feature plan

---

## Phase 0: CRITICAL BUGFIXES (Do First — Nothing Else Works Until These Are Fixed)

These are code-level bugs that will cause runtime crashes or silent data corruption.
Estimated time: 1-2 hours.

### Fix 1: spinService.js — Missing User import
File: server/src/services/spinService.js
Problem: Line 98 references `User.findById(userId)` but User model is never imported.
Will throw ReferenceError: User is not defined on every spin.
Fix: Add `import { User } from '../models/User.js';` at top of file.

### Fix 2: authService.js — Missing MLM registration reward trigger
File: server/src/services/authService.js
Problem: processReferralRegistrationRewards() is coded in mlmRewardService but never called after user registration.
All referral registration bonuses (welcome coins + upline coins) are silently dropped.
Fix: After saving the new user and Referral records, call:
  `await mlmRewardService.processReferralRegistrationRewards(newUser._id);`
Import mlmRewardService at the top.

### Fix 3: constants/roles.js — Missing VENDOR role
File: server/src/constants/roles.js
Problem: ROLES has only SUPER_ADMIN, ADMIN, USER. VENDOR is missing.
Any authenticated USER can access all /vendors/* endpoints.
Fix: Add `VENDOR: 'VENDOR'` to ROLES constant.
Then add `authorize('VENDOR', 'ADMIN', 'SUPER_ADMIN')` to vendorRoutes.js.

### Fix 4: Products.jsx — Inverted price display
File: client/src/pages/Products.jsx line 206
Problem: discountPrice is the sale price, but it is displayed with line-through as if it's the original price.
Fix: Show `price` with line-through, `discountPrice` as the active sale price.

---

## Phase 1: HIGH-PRIORITY BACKEND FIXES (Week 1)

### 1.1 — Coupon Discount Calculation
File: server/src/services/cartService.js (applyCoupon) + orderService.js (createOrder)
Fix:
- In applyCoupon: calculate discountAmount based on coupon.type (PERCENTAGE or FIXED) and coupon.value
- Apply minOrderValue and maxDiscount constraints
- Store discountAmount on Cart
- In createOrder: subtract cart.discountAmount from order total

### 1.2 — Order Status Update Endpoint
New route: PUT /api/orders/:id/status
Auth: Required, authorize ADMIN/SUPER_ADMIN or owning Vendor
Body: { status: 'SHIPPED' | 'DELIVERED' | 'CANCELLED' }
Add controller + service method + route

### 1.3 — Admin User Management
New routes on /api/admin/users:
- GET / — list all users with pagination and filters
- PUT /:id/status — suspend or activate a user
Update adminController.js and adminService.js

### 1.4 — Admin Vendor Management
New routes on /api/admin/vendors:
- GET / — list all vendors (with filter by status: PENDING/APPROVED)
- PUT /:id/status — approve, reject, or suspend a vendor
Update adminController.js and adminService.js
Remove auto-approve from vendorService.registerVendor()
Remove ghost vendor auto-creation from vendorService.getVendorProfile()

---

## Phase 2: HIGH-PRIORITY FRONTEND FIXES (Week 1-2)

### 2.1 — ProtectedRoute Component
File: client/src/routes/ProtectedRoute.jsx (NEW)
Implementation:
```jsx
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" />;
  return children;
};
```
Wrap all /account/*, /vendor/*, /admin/* routes in AppRoutes.jsx.

### 2.2 — Redux cartSlice
File: client/src/store/cartSlice.js (NEW)
Add cart count to Header cart icon
Sync cart state on login and across pages

### 2.3 — Toast Notification System
Replace all alert() calls with a toast library (e.g., react-hot-toast or custom)
Files: Checkout.jsx, VendorDashboard.jsx, Referrals.jsx, SpinWheel.jsx

### 2.4 — Header cleanup
- Vendor Portal link: only show to authenticated vendors/admins
- Cart icon: show item count badge

---

## Phase 3: PAYMENT INTEGRATION (Week 2)

### 3.1 — Install Razorpay SDK
`npm install razorpay` in server/

### 3.2 — Create Payment Routes
New file: server/src/routes/paymentRoutes.js
POST /api/payments/create-order — calls paymentService.createPaymentOrder()
POST /api/payments/verify — calls paymentService.verifyPaymentSignature()
Register in routes/index.js

### 3.3 — Frontend Payment Flow
In Checkout.jsx, after order creation:
- If paymentMethod === 'RAZORPAY': open Razorpay checkout modal
- On Razorpay success callback: call POST /api/payments/verify
- Only navigate to /account/orders on verified payment

---

## Phase 4: IMAGE UPLOAD (Week 2)

### 4.1 — Install Cloudinary + Multer
`npm install cloudinary multer` in server/
Create server/src/services/uploadService.js
Create server/src/routes/uploadRoutes.js with POST /api/upload

### 4.2 — Update Product Forms
VendorDashboard add product modal: add image upload field
ProductDetail: display uploaded image instead of Unsplash fallback

---

## Phase 5: EMAIL + AUTH FLOWS (Week 3)

### 5.1 — Install Nodemailer
`npm install nodemailer` in server/
Create emailService.js with sendVerificationEmail, sendPasswordResetEmail

### 5.2 — Email Verification
New routes: GET /api/auth/verify-email?token=
Generate email verification token on register
Mark emailVerified: true on successful verification

### 5.3 — Password Reset
New routes: POST /api/auth/forgot-password, POST /api/auth/reset-password
Token-based reset flow with 1-hour expiry

---

## Phase 6: PRODUCT REVIEWS (Week 3)

### 6.1 — Backend
Create reviewController.js + reviewService.js
Routes: GET /api/reviews/product/:productId, POST /api/reviews, DELETE /api/reviews/:id
Restrict POST to verified purchasers (isVerifiedPurchase)

### 6.2 — Frontend
Add review section to ProductDetail.jsx
Star rating component
Review submission form (requires login)

---

## Phase 7: WISHLIST (Week 3)

### 7.1 — Backend
Create wishlistController.js + wishlistService.js
Routes: GET /api/wishlist, POST /api/wishlist/add, DELETE /api/wishlist/:productId

### 7.2 — Frontend
Add wishlist heart button to product cards
Wishlist page at /account/wishlist

---

## Phase 8: NOTIFICATIONS (Week 3-4)

### 8.1 — Backend
Create notificationController.js + notificationService.js
Routes: GET /api/notifications, PUT /api/notifications/:id/read, PUT /api/notifications/read-all
Dispatch notifications on: order placed, order status change, coin credit, spin win

### 8.2 — Frontend
Notification bell in Header with unread count badge
Notification dropdown or page

---

## Phase 9: DATABASE HARDENING (Week 4)

### 9.1 — Mongoose Transactions
Wrap orderService.createOrder() in a Mongoose session transaction
All writes (Order, Cart clear, stock decrement, coin debit, vendor balance) must be atomic

### 9.2 — Resolve Dual-Write Problem
Decision: Remove fairCoinBalance from User model, use Wallet.balance as single source of truth
Update all references: spinService, mlmRewardService, authController

### 9.3 — Missing Indexes
Add compound index to SpinHistory: { userId: 1, wheelId: 1, createdAt: -1 }
Add TTL index to CoinTransaction (365 days) and AuditLog (730 days)

---

## Phase 10: ADMIN PANEL EXPANSION (Week 4)

### 10.1 — Admin Coupon Management
Routes: GET /api/admin/coupons, POST /api/admin/coupons, PUT /:id, DELETE /:id
Frontend: AdminDashboard tab for coupons

### 10.2 — Admin Product Approval
Routes: GET /api/admin/products?status=PENDING_APPROVAL, PUT /:id/status
Frontend: AdminDashboard tab for pending products

### 10.3 — Admin Order Management
Route: GET /api/admin/orders (all orders with filters)
Frontend: AdminDashboard tab for orders

---

## Phase 11: DEVOPS (Week 5)

### 11.1 — Docker
Create Dockerfile for server
Create docker-compose.yml with: server + MongoDB + Redis

### 11.2 — Install Redis
`npm install ioredis` in server/
Use for: refresh token blocklist, spin eligibility cache, rate limit storage

### 11.3 — .gitignore
Add server/.env to .gitignore immediately
Rotate JWT secrets

---

## Phase 12: TESTING (Ongoing)

### 12.1 — Install test framework
`npm install --save-dev jest supertest` in server/
`npm install --save-dev vitest @testing-library/react` in client/

### 12.2 — Priority tests
- Unit: mlmRewardService (all 3 levels), spinService weighted random, fairCoinService debit
- Integration: full order flow, spin flow, referral tree
- E2E: Register → refer → order → earn coins → spin → wallet

---

## Priority Matrix

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| P0 | Fix spinService User import | 5 min | Unblocks spin wheel |
| P0 | Fix MLM registration rewards | 10 min | Fixes referral incentive |
| P0 | Fix VENDOR role | 15 min | Fixes security hole |
| P1 | ProtectedRoute | 30 min | Fixes auth security |
| P1 | Coupon discount calc | 1 hour | Fixes coupon feature |
| P1 | Order status update | 2 hours | Core operations |
| P1 | Admin user/vendor mgmt | 4 hours | Admin operations |
| P2 | Payment integration | 1 day | Revenue critical |
| P2 | Image upload | 4 hours | Product management |
| P2 | Email verification | 4 hours | Trust/security |
| P3 | Reviews + Wishlist | 1 day | User engagement |
| P3 | Notifications | 1 day | User engagement |
| P4 | Docker | 4 hours | Devops |
| P4 | Tests | 2 days | Quality |
