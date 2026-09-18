# API STATUS REPORT — FairKart REST API
> Generated: 2026-08-25 | Base URL: http://localhost:5000/api

---

## Authentication

All protected routes require: Authorization: Bearer <accessToken>
Alternatively: accessToken cookie (HTTP-only)
Refresh: POST /api/auth/refresh-token (uses HTTP-only refreshToken cookie)

---

## Route Groups

### AUTH — /api/auth
| Method | Endpoint | Auth | Validation | Status |
|--------|---------|------|-----------|--------|
| POST | /register | No | Zod: name, email, password, phone?, referralCode? | WORKING |
| POST | /login | No | Zod: email, password | WORKING |
| POST | /refresh-token | No | Zod: refreshToken? | WORKING |
| POST | /logout | Required | None | WORKING |
| GET | /me | Required | None | WORKING |

### PRODUCTS — /api/products
| Method | Endpoint | Auth | Status | Notes |
|--------|---------|------|--------|-------|
| GET | / | No | WORKING | ?search=, ?category=, ?brand=, ?vendor=, ?sort=, ?page=, ?limit= |
| GET | /:slug | No | WORKING | Returns populated vendor/category/brand |
| POST | / | Required (Admin) | WORKING | Admin route inside productController |

### CATEGORIES — /api/categories
| Method | Endpoint | Auth | Status |
|--------|---------|------|--------|
| GET | / | No | WORKING |
| POST | / | Required (Admin) | WORKING |

### CART — /api/cart
| Method | Endpoint | Auth | Status | Notes |
|--------|---------|------|--------|-------|
| GET | / | Required | WORKING | Returns cart with populated product refs |
| POST | /add | Required | WORKING | { productId, quantity } |
| PUT | /update | Required | WORKING | { productId, quantity } — qty=0 removes item |
| POST | /apply-coupon | Required | PARTIALLY | Stores coupon code but does not calculate discount |

### ORDERS — /api/orders
| Method | Endpoint | Auth | Status | Notes |
|--------|---------|------|--------|-------|
| POST | / | Required | WORKING | { shippingAddress, paymentMethod, fairCoinsToRedeem } |
| GET | /my-orders | Required | WORKING | Paginated user orders |
| GET | /:id | Required | WORKING | Single order with VendorOrders populated |
| PUT | /:id/status | MISSING | — | Orders permanently stuck at CONFIRMED |

### REFERRALS — /api/referrals
| Method | Endpoint | Auth | Status |
|--------|---------|------|--------|
| GET | /my-link | Required | WORKING |
| GET | /tree | Required | WORKING | Returns 3-level tree, rank, leaderboard, stats |
| POST | /team-message | Required | WORKING | Broadcast to Level 1 downline |
| GET | /team-messages | Required | WORKING | Messages from upline sponsor |

### FAIR COINS — /api/fair-coins
| Method | Endpoint | Auth | Status |
|--------|---------|------|--------|
| GET | /wallet | Required | WORKING |
| GET | /transactions | Required | WORKING | Paginated ledger |

### SPIN — /api/spin
| Method | Endpoint | Auth | Status | Notes |
|--------|---------|------|--------|-------|
| GET | /wheel | Required | BROKEN | spinService crashes on User ReferenceError |
| POST | /spin | Required | BROKEN | spinService crashes on User ReferenceError |

### VENDORS — /api/vendors
| Method | Endpoint | Auth | Role Guard | Status | Notes |
|--------|---------|------|-----------|--------|-------|
| POST | /register | Required | None (BUG) | WORKING | Should require VENDOR/ADMIN role |
| GET | /dashboard | Required | None (BUG) | WORKING | Auto-creates ghost vendor profile |
| POST | /products | Required | None (BUG) | WORKING | — |
| POST | /withdraw | Required | None (BUG) | WORKING | — |

### ADMIN — /api/admin
| Method | Endpoint | Auth | Role | Status | Notes |
|--------|---------|------|------|--------|-------|
| GET | /metrics | Required | ADMIN/SUPER_ADMIN | WORKING | |
| POST | /settings | Required | ADMIN/SUPER_ADMIN | WORKING | Creates AuditLog |
| GET | /audit-logs | Required | SUPER_ADMIN only | WORKING | |
| GET | /users | MISSING | — | — | — |
| GET | /vendors | MISSING | — | — | — |
| GET | /coupons | MISSING | — | — | — |

### HEALTH — /api/health
| Method | Endpoint | Auth | Status |
|--------|---------|------|--------|
| GET | / | No | WORKING |

---

## Missing API Routes (Not Implemented)

| Route Group | Endpoints Needed |
|-------------|-----------------|
| /api/payments | POST /create-order (Razorpay), POST /verify |
| /api/orders | PUT /:id/status (update order status) |
| /api/admin/users | GET / (list), PUT /:id/status (suspend/activate) |
| /api/admin/vendors | GET / (list), PUT /:id/status (approve/reject) |
| /api/admin/coupons | GET /, POST /, PUT /:id, DELETE /:id |
| /api/admin/products | GET / (pending), PUT /:id/status (approve/reject) |
| /api/reviews | GET /product/:productId, POST /, DELETE /:id |
| /api/wishlist | GET /, POST /add, DELETE /:productId |
| /api/notifications | GET /, PUT /:id/read, PUT /read-all |
| /api/auth | POST /forgot-password, POST /reset-password, GET /verify-email |
| /api/upload | POST / (Cloudinary image upload) |

---

## Response Format

All endpoints return consistent format:
```json
// Success
{ "success": true, "statusCode": 200, "message": "...", "data": { ... } }

// Error
{ "success": false, "message": "...", "errorCode": "...", "errors": [] }
```

---

## API Security

| Feature | Status |
|---------|--------|
| Rate limiting | Global 300 req/15min |
| CORS | Configured with CLIENT_URL and credentials: true |
| Helmet | Enabled |
| JWT | Bearer + HTTP-only cookie |
| Input validation | Auth routes only (Zod) |
| NoSQL injection protection | Not installed |
| CSRF protection | Not implemented |
