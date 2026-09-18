# PROJECT AUDIT — FairKart / Babu Super Market Platform
> Audit Date: 2026-08-25 | Senior Full-Stack Engineer Review

---

## A. Current Architecture

Backend: Node.js (ESM) + Express 4 + MongoDB + Mongoose 8 + JWT + bcryptjs + Zod + helmet + morgan + cookie-parser + express-rate-limit
Frontend: React 18 + Vite 5 + Tailwind CSS 3 + React Router 6 + Axios + Redux Toolkit + Framer Motion + Recharts + Lucide React

```
fairkart-platform/
├── client/src/
│   ├── components/     Header.jsx, Footer.jsx (2 files only)
│   ├── layouts/        MainLayout.jsx
│   ├── pages/          13 pages
│   ├── routes/         AppRoutes.jsx (NO route guards)
│   ├── services/       api.js (Axios + interceptors)
│   └── store/          authSlice.js only (1 Redux slice)
└── server/src/
    ├── config/         db.js, env.js
    ├── constants/      responseCodes.js, roles.js
    ├── controllers/    11 controllers
    ├── middleware/     authMiddleware, roleMiddleware, errorMiddleware, validateMiddleware
    ├── models/         26 Mongoose models
    ├── routes/         12 route files
    ├── services/       10 services
    ├── utils/          ApiError, ApiResponse, asyncWrapper, jwt
    └── validators/     authValidator.js (ONLY 1 file)
    scripts/            seed.js, testPhase1.js
```

---

## B. Module Classification

### BUILT AND WORKING ✅

| Module | Evidence |
|--------|---------|
| Server startup | server.js + app.js with graceful DB fallback |
| JWT auth (access + refresh) | 15m access token, 7d refresh token, HTTP-only cookie, bcrypt hash rotation |
| User registration | Referral code generation, referralPath population, email/phone uniqueness |
| User login | bcrypt compare, lastLoginAt, token pair generation |
| Refresh token rotation | verifyAndRotateRefreshToken, hashed token in DB |
| Logout | Token revocation, cookie clear |
| Auth middleware | Bearer + cookie fallback, SUSPENDED user check |
| RBAC middleware | authorize() factory function |
| Zod validation (auth only) | register + login + refreshToken schemas |
| Centralized error handler | ApiError class, dev stack traces |
| Health check | GET /api/health with DB state + uptime |
| Product listing | Pagination, text search, category/brand/vendor filters, sort |
| Product detail | Slug-based lookup, populated references |
| Category read+create | No update/delete |
| Cart | add, update quantity, remove (qty=0), apply coupon code |
| Order creation | Stock check, multi-vendor VendorOrder split, stock decrement, cart clear |
| Fair Coins wallet | Credit/debit with balance validation, ledger entries |
| Fair Coins ledger | Paginated CoinTransaction history |
| Purchase reward | 1 coin per Rs100 on order |
| MLM purchase commission | 3-level upline gets coins on every order |
| MLM referral tree | 3-level tree, rank calculation, leaderboard |
| Referral link | GET /api/referrals/my-link |
| Team messaging | Send broadcast + receive from upline |
| Spin Wheel | Weighted random, daily limit, SpinHistory, coin credit, auto-seed |
| Vendor registration | registerVendor, slug, auto-approved in dev |
| Vendor dashboard | Stats, recent orders, withdrawals |
| Vendor product create | Via /vendors/products |
| Vendor withdrawal | requestWithdrawal, balance deduct |
| Admin metrics | Users, vendors, products, orders, revenue, coins issued |
| Admin settings | updateSettings with AuditLog |
| Audit log retrieval | SUPER_ADMIN only |
| Seed script | Users, vendor, categories, brands, products, spin wheel, MLM config |
| Phase 1 integration tests | Health, register, referral signup, login, protected route |
| All 13 frontend pages | Login, Register, Home, Products, ProductDetail, Cart, Checkout, Orders, Wallet, SpinWheel, Referrals, VendorDashboard, AdminDashboard |
| Axios API client | Token injection + 401 refresh+retry interceptors |
| Rate limiting | 300 req/15min global |
| Security headers | helmet + CORS with credentials |

---

### PARTIALLY BUILT ⚠️

| Module | What Works | What's Missing |
|--------|-----------|----------------|
| Coupon System | Model, applyCoupon, code stored on Cart | Discount amount never calculated — discountAmount field always 0 |
| Payment Integration | paymentService.js, Payment model, createPaymentOrder, verifySignature | NO route — paymentService is orphaned, unreachable |
| MLM Registration Rewards | processReferralRegistrationRewards() fully coded | NEVER called in authService.register() — critical missing call |
| Vendor Role | Vendor model, routes | 'VENDOR' not in ROLES constant, no role guard on /vendors/* |
| Admin Vendor Mgmt | Vendor model | No routes to list/approve/reject/suspend vendors |
| Product Approval | Status enum: PENDING_APPROVAL/APPROVED/REJECTED | All products auto-created as APPROVED, no approval workflow |
| Review System | Review model | Zero controller, route, or service |
| Notification System | Notification model | Zero controller, route, or service |
| Wishlist | Wishlist model | Zero controller, route, or service |
| Campaign System | Campaign model | Zero controller, route, or service |
| Redux State | authSlice (complete) | No cartSlice, productSlice, orderSlice |
| Admin User Mgmt | Metrics view | Cannot list/suspend/activate users |
| Validator Coverage | Auth routes validated | No Zod on cart, order, product, vendor, spin routes |
| Order Status Update | Status enum complete | No endpoint to update status (SHIPPED, DELIVERED) |
| Frontend Route Guards | None | No ProtectedRoute component |
| Image Upload | .env.example has Cloudinary vars | No Cloudinary SDK, no multer, no upload endpoint |

---

### BROKEN 🔴

| Bug | File | Severity |
|-----|------|----------|
| MLM registration rewards never fire — processReferralRegistrationRewards() exists but is NEVER called in authService.register() | authService.js | CRITICAL |
| spinService references User model but never imports it — will throw ReferenceError on every spin | spinService.js line 98 | CRITICAL |
| 'VENDOR' role not in ROLES constant — any USER can access /vendors/* | constants/roles.js + vendorRoutes.js | HIGH |
| Coupon discount not applied to order total — coupon code stored but ignored | orderService.js + cartService.js | MEDIUM |
| paymentService has no route — isolated service, never reachable | paymentService.js | MEDIUM |
| Both COD and Razorpay set paymentStatus=PENDING — dead branch | orderService.js line 80 | LOW |
| Price display inverted — discountPrice shown as strikethrough over price | Products.jsx line 206 | LOW |
| No frontend route guards — protected pages accessible without login | AppRoutes.jsx | HIGH |
| Ghost vendor auto-created for any user who hits /vendors/dashboard | vendorService.getVendorProfile() | MEDIUM |

---

### MISSING 🚫

| Module | Priority |
|--------|----------|
| Razorpay payment gateway | CRITICAL — no payment is processed |
| ProtectedRoute component (frontend) | HIGH |
| Email verification flow | HIGH — emailVerified field exists but never set |
| Password reset / forgot password | HIGH |
| Admin: list/manage users | HIGH |
| Admin: list/approve/reject vendors | HIGH |
| Order status update endpoint | HIGH — orders stuck at CONFIRMED |
| Image upload (Cloudinary + multer) | HIGH |
| Product reviews | MEDIUM |
| Wishlist | MEDIUM |
| Notification dispatch + retrieval | MEDIUM |
| Admin: manage coupons | MEDIUM |
| Admin: approve/reject products | MEDIUM |
| Redux cartSlice | MEDIUM |
| Zod validators on all routes | MEDIUM |
| Campaign management | LOW |
| Docker / docker-compose | LOW |
| Redis | LOW |
| Phone OTP | LOW |

---

## C. Security Issues

| Issue | Risk |
|-------|------|
| Hardcoded fallback JWT secrets in env.js | HIGH |
| 'VENDOR' role undefined — any user becomes vendor | HIGH |
| .env committed with real JWT secrets | HIGH |
| No frontend route guards | MEDIUM |
| Ghost vendor auto-creation | MEDIUM |
| Products always auto-approved | MEDIUM |
| No CSRF protection | LOW |
| Global-only rate limit | LOW |

---

## D. Database Issues

| Issue | Impact |
|-------|--------|
| No Mongoose transactions | Partial writes on order failure |
| fairCoinBalance dual-write (User + Wallet) | Can drift |
| No TTL index on CoinTransaction/AuditLog | Unbounded growth |
| No compound index on SpinHistory(userId, wheelId, createdAt) | Slow daily eligibility at scale |
| No connection pool config | Default settings |

---

## E. Missing Dependencies

| Package | Purpose |
|---------|---------|
| razorpay | Payment SDK |
| nodemailer / @sendgrid/mail | Email |
| cloudinary | Image hosting |
| multer | File upload |
| ioredis | Redis |
| express-mongo-sanitize | NoSQL injection |
| jest / vitest / supertest | Testing |

---

## F. Testing Status

| Area | Status |
|------|--------|
| Unit tests | None |
| Integration tests | 5 tests (auth only) via native fetch |
| E2E tests | None |
| Frontend tests | None |
| No test framework installed | — |

---

## G. Docker Status

MISSING — No Dockerfile or docker-compose.yml exists.
