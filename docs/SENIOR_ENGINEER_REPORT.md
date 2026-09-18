# SENIOR ENGINEER REPORT — FairKart / Babu Super Market Platform
> Date: 2026-08-25 | Classification: INTERNAL ENGINEERING REVIEW

---

## Executive Summary

FairKart is a multi-vendor e-commerce platform with MLM referral rewards, Fair Coins loyalty,
and a Spin & Win engine. The codebase is architecturally sound, professionally structured,
and approximately 65-70% complete. The core infrastructure (auth, products, cart, orders,
MLM commissions, spin wheel, referrals, vendor portal, admin panel) is built and working.

However, there are 3 CRITICAL runtime bugs that will crash or silently break core features,
several HIGH-priority security holes, and significant missing modules before the platform
can go to production.

This report details the exact state of every module, ranks all issues by severity,
and provides an ordered execution plan.

---

## Overall Completeness Score

| Area | Score | Notes |
|------|-------|-------|
| Backend Infrastructure | 9/10 | Auth, routing, middleware, error handling — excellent |
| Data Models | 8/10 | 26 models, all well-designed. Role model unused |
| Backend Business Logic | 6/10 | 3 critical bugs, 4 missing core services |
| API Surface | 6/10 | 8 missing route groups |
| Frontend Pages | 8/10 | All 13 pages render. No route guards |
| Frontend State (Redux) | 4/10 | Only 1 of ~5 needed slices exists |
| Security | 5/10 | JWT solid. Vendor role missing, .env committed |
| Testing | 2/10 | 5 integration tests, no unit/E2E tests |
| DevOps | 0/10 | No Docker, no CI/CD |
| **Overall** | **~58/100** | Production-ready after focused 4-5 week sprint |

---

## CRITICAL BUGS — Fix Before Anything Else

### BUG 1: Spin Wheel Runtime Crash (SEVERITY: CRITICAL)
File: server/src/services/spinService.js, line 98
Symptom: Every call to POST /api/spin/spin throws:
  ReferenceError: User is not defined
Root Cause: User model is used but never imported in spinService.js
Impact: The entire Spin & Win feature is non-functional
Fix (5 minutes):
  Add to top of spinService.js:
  import { User } from '../models/User.js';

### BUG 2: MLM Registration Rewards Never Fire (SEVERITY: CRITICAL)
File: server/src/services/authService.js
Symptom: Users who register with a referral code receive no welcome bonus.
  Referrers receive no registration commission.
Root Cause: mlmRewardService.processReferralRegistrationRewards() is fully coded but
  is never called anywhere. The Referral record is saved, but reward processing is skipped.
Impact: The entire referral incentive loop is broken for new signups.
Fix (10 minutes):
  In authService.register(), after saving the Referral record, add:
  import mlmRewardService from './mlmRewardService.js';
  await mlmRewardService.processReferralRegistrationRewards(newUser._id);

### BUG 3: VENDOR Role Missing — Security Hole (SEVERITY: CRITICAL / SECURITY)
File: server/src/constants/roles.js + server/src/routes/vendorRoutes.js
Symptom: Any registered user can:
  - Register as a vendor
  - Access the vendor dashboard
  - Create products (auto-published as APPROVED)
  - Request withdrawals from non-existent balance
Root Cause: 'VENDOR' is not defined in the ROLES constant. vendorRoutes.js has NO role guard.
Impact: Complete vendor system bypass. Any user becomes a vendor. Products auto-approved
  and published without admin review. Withdrawal requests with no balance validation.
Fix (15 minutes):
  1. Add VENDOR: 'VENDOR' to constants/roles.js ROLES object and USER_STATUS-adjacent enum
  2. Add authorize('VENDOR', 'ADMIN', 'SUPER_ADMIN') to vendorRoutes.js
  3. Update User.role Mongoose enum to include 'VENDOR'
  4. Update vendorService.registerVendor() to set user.role = 'VENDOR' after approval

---

## HIGH-PRIORITY ISSUES — Fix in Week 1

### ISSUE 4: Coupon Discount Silently Ignored
cartService.applyCoupon() saves the coupon code to Cart but does NOT calculate
discountAmount. orderService.createOrder() does not subtract any coupon discount.
Users apply coupons believing they get a discount, but pay full price.
Fix: Implement discount calculation in cartService.applyCoupon() and propagate to order.

### ISSUE 5: No Frontend Route Guards
AppRoutes.jsx has no ProtectedRoute wrapper. Unauthenticated users can navigate
directly to /account/wallet, /vendor/dashboard, /admin/dashboard.
The API correctly returns 401, but the frontend shows a blank loading state with
no redirect to login.
Fix: Create ProtectedRoute.jsx component and wrap all auth-required routes.

### ISSUE 6: .env File Committed with Real JWT Secrets
server/.env exists in the codebase (not in .gitignore) and contains actual
JWT secrets. If this repo is ever pushed to GitHub, credentials are compromised.
Fix (IMMEDIATE): Add server/.env to .gitignore. Rotate all JWT secrets.

### ISSUE 7: Payment Flow Completely Non-Functional
paymentService.js is coded but has no route. The Checkout page lets users
"pay with Razorpay" but places the order immediately without any payment.
All orders go CONFIRMED with paymentStatus: PENDING regardless of method.
Fix: Connect paymentService via /api/payments route group. Implement Razorpay SDK flow.

### ISSUE 8: Orders Stuck at CONFIRMED Forever
There is no PUT /api/orders/:id/status endpoint. No vendor or admin can mark
orders as PROCESSING, SHIPPED, or DELIVERED. Every order is permanently CONFIRMED.
Fix: Add order status update endpoint with vendor and admin access.

---

## MEDIUM-PRIORITY ISSUES — Fix in Week 2-3

### ISSUE 9: Admin Cannot Manage Users or Vendors
The admin panel shows metrics but has no ability to:
- List all users
- Suspend/activate a user
- List vendors by status
- Approve or reject pending vendor applications
This blocks all operational admin workflows.

### ISSUE 10: Ghost Vendor Auto-Creation Security Risk
vendorService.getVendorProfile() auto-creates a demo Vendor document if none exists
for the authenticated user. Any user who visits /vendors/dashboard becomes a "vendor"
silently, even without registering.
Fix: Remove auto-creation. Return 404 if no vendor profile found.

### ISSUE 11: Product Images — All Hardcoded Unsplash URLs
No image upload system exists. Cloudinary keys are in .env.example but the
SDK is not installed and no upload endpoint exists. All product images are
placeholder Unsplash URLs.

### ISSUE 12: Review, Wishlist, Notification — Models with No Wiring
Three complete Mongoose models (Review, Wishlist, Notification) exist with proper
schemas and indexes, but have zero controllers, services, or routes.
These are completely dark features.

### ISSUE 13: fairCoinBalance Dual-Write Risk
User.fairCoinBalance and Wallet.balance are both maintained simultaneously.
If one write succeeds and the other fails (e.g., network timeout), they drift.
There is no reconciliation mechanism.
Decision needed: Pick one as the source of truth and remove the other.

---

## ARCHITECTURE STRENGTHS

These are done correctly and should not be changed:

1. ESM Modules throughout — consistent `import/export` syntax
2. Controller-Service-Model separation — clean, testable architecture
3. asyncWrapper utility — eliminates try/catch boilerplate in controllers
4. ApiError + ApiResponse — consistent response envelopes everywhere
5. Centralized error middleware — all errors flow through one handler
6. Zod env validation — server fails fast on missing config
7. JWT refresh token rotation — bcrypt-hashed token in DB, rotates on every use
8. HTTP-only cookie + Bearer dual support — secure and flexible
9. Axios 401 retry interceptor — transparent token refresh on frontend
10. Text search index on Products — full-text search ready
11. VendorOrder sub-order splitting — correct multi-vendor order architecture
12. Referral path array — O(1) upline lookups for MLM commission
13. Weighted random spin — backend-authoritative, client only animates
14. Seed script — comprehensive, idempotent (upsert-based)

---

## HIGH-RISK AREAS

These are the most dangerous areas technically — highest chance of bugs at scale:

1. **Order creation transaction safety** — 7 sequential writes with no Mongoose
   session. A mid-order failure leaves partial data (stock decremented but order
   not saved, or coins debited but order not confirmed).

2. **MLM commission calculation** — processPurchaseCommission walks up a referral
   chain. If the chain has a cycle (data bug) this will loop. No max-depth guard beyond
   the level check. Performance degrades with deep chains.

3. **Spin wheel concurrent requests** — If a user double-clicks SPIN, two POST /spin
   requests can land simultaneously before SpinHistory is written, granting 2 spins.
   Needs an atomic check-and-write (Mongoose transaction or conditional update).

4. **Coin debit race conditions** — creditCoins and debitCoins read balance then write.
   Two concurrent operations on the same wallet can overdraw the balance.
   Needs findOneAndUpdate with $inc or optimistic locking.

5. **Vendor balance withdrawal** — requestWithdrawal deducts balance with two separate
   operations. Same race condition as coins.

---

## DEPENDENCY GAP SUMMARY

Install these before implementing the corresponding features:

```
# In server/
npm install razorpay                    # Payment
npm install nodemailer                  # Email
npm install cloudinary multer           # Image upload
npm install ioredis                     # Redis/caching
npm install express-mongo-sanitize      # Security
npm install --save-dev jest supertest   # Tests

# In client/
npm install react-hot-toast             # Toast notifications
npm install --save-dev vitest @testing-library/react  # Tests
```

---

## RECOMMENDED EXECUTION ORDER

```
WEEK 1 — STABILIZE
  Day 1:  Fix BUG 1 (spinService import) + BUG 2 (MLM rewards) + BUG 3 (VENDOR role)
  Day 1:  Add server/.env to .gitignore, rotate secrets
  Day 2:  Add ProtectedRoute (frontend)
  Day 3:  Fix coupon discount calculation
  Day 4:  Add order status update endpoint + vendor/admin routes
  Day 5:  Add admin user + vendor management routes

WEEK 2 — PAYMENT + UPLOADS
  Day 1-2:  Razorpay integration (backend service → route → frontend modal)
  Day 3:    Cloudinary + multer image upload
  Day 4-5:  Email verification + password reset

WEEK 3 — USER FEATURES
  Day 1-2:  Product reviews (backend + frontend)
  Day 3:    Wishlist (backend + frontend)
  Day 4-5:  Notification system (backend + frontend bell)

WEEK 4 — HARDENING
  Day 1-2:  Mongoose transactions on order creation
  Day 2:    Resolve fairCoinBalance dual-write
  Day 3:    Missing DB indexes + TTL indexes
  Day 4-5:  Zod validators on all routes

WEEK 5 — DEVOPS + TESTING
  Day 1:    Docker + docker-compose
  Day 2-5:  Unit + integration test suite
```

---

## FILES TO REVIEW IMMEDIATELY

| File | Why |
|------|-----|
| server/src/services/spinService.js | Runtime crash — User not imported |
| server/src/services/authService.js | MLM rewards never fire |
| server/src/constants/roles.js | VENDOR role missing |
| server/src/routes/vendorRoutes.js | No role guard — security hole |
| server/.env | Committed with real secrets — add to .gitignore |
| server/src/services/vendorService.js | Ghost vendor auto-creation |
| server/src/services/cartService.js | Coupon discount not calculated |
| server/src/services/orderService.js | Coupon discount not applied, no transactions |
| client/src/routes/AppRoutes.jsx | No ProtectedRoute |
| client/src/pages/Products.jsx | Price display inverted |

---

## Documentation Index

All detailed documentation is in /docs/:

- PROJECT_AUDIT.md    — Complete module inventory (WORKING / PARTIAL / BROKEN / MISSING)
- BACKEND_STATUS.md   — Every controller, service, route, middleware with status
- FRONTEND_STATUS.md  — Every page, component, Redux slice with status
- DATABASE_STATUS.md  — Every model, schema, index, relationship
- API_STATUS.md       — Every endpoint with auth, validation, status
- IMPLEMENTATION_PLAN.md — Phased fix and feature plan (Phase 0–12)
