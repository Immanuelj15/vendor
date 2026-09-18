# FRONTEND STATUS REPORT — FairKart Client
> Generated: 2026-08-25 | client/ directory

---

## Tech Stack
- React 18.3.1 + Vite 5.2.12
- Tailwind CSS 3.4.3
- React Router 6.23.1
- Redux Toolkit 2.2.5
- Axios 1.7.2
- Framer Motion 11.2.10
- Recharts 2.12.7
- Lucide React 0.395.0

---

## App Entry Points

| File | Status | Notes |
|------|--------|-------|
| main.jsx | WORKING | React 18 createRoot, Redux Provider wrapper |
| App.jsx | WORKING | BrowserRouter, fetchCurrentUser on mount, fk_auth_logout event listener |
| layouts/MainLayout.jsx | WORKING | Header + Outlet + Footer |
| routes/AppRoutes.jsx | PARTIALLY BUILT | All routes defined, NO ProtectedRoute wrapper |
| services/api.js | WORKING | Axios instance, Bearer injection, 401 refresh+retry |
| store/store.js | PARTIALLY BUILT | Only authReducer — no other slices |
| store/authSlice.js | WORKING | loginUser, registerUser, fetchCurrentUser, logoutUser async thunks |

---

## Pages (13 total)

| Page | Route | Auth Required? | Status | Issues |
|------|-------|---------------|--------|--------|
| Home.jsx | / | No | WORKING | Static marketing, auth-aware CTA |
| Login.jsx | /login | No | WORKING | Redux dispatch, error display, auto-redirect |
| Register.jsx | /register | No | WORKING | Referral code from URL ?ref=, all form fields |
| Products.jsx | /products | No | WORKING | Search, category filter, sort, product cards |
| ProductDetail.jsx | /products/:slug | No | WORKING | Add to cart, redirects to login if unauthenticated |
| Cart.jsx | /cart | Should be | WORKING | Fair Coins redemption UI, quantity controls |
| Checkout.jsx | /checkout | Should be | WORKING | Address form, payment method, order placement |
| Orders.jsx | /account/orders | Should be | WORKING | Order list, status, items |
| Wallet.jsx | /account/wallet | Should be | WORKING | Balance cards, ledger table |
| SpinWheel.jsx | /account/spin | Should be | WORKING | SVG wheel, Framer Motion animation, coin update |
| Referrals.jsx | /account/referrals | Should be | WORKING | MLM tree, QR code, leaderboard, analytics chart, team messaging |
| VendorDashboard.jsx | /vendor/dashboard | Should be | WORKING | Metrics, orders, add product modal, withdrawal modal |
| AdminDashboard.jsx | /admin/dashboard | Should be | WORKING | Metrics cards, MLM settings, audit logs |

Note: "Should be" means auth is enforced at the API level, but no frontend route guard exists.

---

## Components (2 files)

| Component | Status | Notes |
|-----------|--------|-------|
| Header.jsx | WORKING | Brand logo, nav links, coin balance badge, logout |
| Footer.jsx | WORKING | Static footer |

Missing components that should exist:
- ProtectedRoute.jsx — route guard
- Toast/Notification component — replaces alert()
- LoadingSpinner — exists inline only
- CartBadge in Header — no cart count displayed
- OrderDetail page or modal

---

## Redux State

| Slice | Status | Fields |
|-------|--------|--------|
| authSlice | WORKING | user, accessToken, isAuthenticated, isLoading, error |
| cartSlice | MISSING | Cart not in Redux state — local component state only |
| productSlice | MISSING | — |
| orderSlice | MISSING | — |
| notificationSlice | MISSING | — |

---

## API Calls by Page

| Page | API Calls | Notes |
|------|-----------|-------|
| Login | POST /auth/login | Redux thunk |
| Register | POST /auth/register | Redux thunk |
| Products | GET /products, GET /categories | Direct API calls |
| ProductDetail | GET /products/:slug, POST /cart/add | Direct API calls |
| Cart | GET /cart, PUT /cart/update | Direct API calls |
| Checkout | POST /orders | Direct API call |
| Orders | GET /orders/my-orders | Direct API call |
| Wallet | GET /fair-coins/wallet, GET /fair-coins/transactions | Direct API calls |
| SpinWheel | GET /spin/wheel, POST /spin/spin | Direct API calls |
| Referrals | GET /referrals/tree, GET /referrals/team-messages, POST /referrals/team-message | Direct API calls |
| VendorDashboard | GET /vendors/dashboard, POST /vendors/products, POST /vendors/withdraw, GET /categories | Direct API calls |
| AdminDashboard | GET /admin/metrics, GET /admin/audit-logs, POST /admin/settings | Direct API calls |

---

## Critical Frontend Fixes Required

1. ADD ProtectedRoute component — wrap all /account/*, /vendor/*, /admin/* routes
2. ADD cartSlice to Redux — show cart count in Header
3. REPLACE alert() with toast notifications throughout
4. FIX price display in Products.jsx — `price` should be strikethrough, `discountPrice` should be the sale price
5. ADD route guard to Header Vendor Portal link — only show to authenticated vendors
6. ADD user profile / account settings page
7. ADD order detail page/modal
8. IMPLEMENT pagination on Products page (API supports it)
9. ADD mobile navigation hamburger menu
10. ADD loading state management for all pages

---

## Design System

| Item | Status |
|------|--------|
| Tailwind CSS | Configured with custom brand colors (brand-400/500/600) |
| Dark theme | Consistent slate-900/950 background throughout |
| Framer Motion | Used on Home, Login, Register, Products, Referrals, SpinWheel |
| Recharts | Used on Referrals page for MLM analytics bar chart |
| Lucide React | Used for all icons throughout |
| Google Fonts | Not configured — using system fonts |
| index.css | Has brand-gradient-text utility class, custom scrollbar |
