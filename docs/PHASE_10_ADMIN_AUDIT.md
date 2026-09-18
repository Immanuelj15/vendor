# Phase 10 — Admin Audit Report

## 1. Existing Admin Metrics
The existing metrics retrieved by `GET /api/admin/metrics` include:
* **totalUsers**: Count of all users in the system.
* **totalVendors**: Count of all vendors.
* **totalProducts**: Count of all products.
* **totalOrders**: Count of all orders.
* **totalRevenue**: Aggregated sum of `total` for paid orders (`paymentStatus: 'PAID'`).

## 2. Existing Audit Logs
The system uses the `AuditLog` model with the following fields:
* `userId`: Reference to the `User` performing the action.
* `action`: Action string (e.g., `UPDATE_SETTINGS`, `USER_STATUS_ACTIVE`, `USER_STATUS_SUSPENDED`, `VENDOR_STATUS_APPROVED`).
* `entity`: The name of the collection/model modified (e.g. `User`, `Vendor`, `Settings`).
* `entityId`: Stringified ID of the modified entity.
* `oldValue`: Mixed type containing the previous state.
* `newValue`: Mixed type containing the new state.
* `ipAddress`: IP address of the requester.

## 3. Settings Configuration
Settings are persisted in the `Settings` model.
* **MLM_CONFIG** (`category: 'MLM'`): Contains parameters like level percentages and max levels.
* **FAIR_COIN_RULES** (`category: 'FAIR_COINS'`): Defines `registrationCoins` and `referralCoins` rewards.
* Other settings categories permitted by the enum: `['MLM', 'FAIR_COINS', 'SPIN_WHEEL', 'MARKETPLACE', 'GENERAL']`.

## 4. Roles and Permissions
Roles defined in `ROLES` constant (`server/src/constants/roles.js`):
* `SUPER_ADMIN`
* `ADMIN`
* `STATE_FRANCHISE`
* `DISTRICT_FRANCHISE`
* `TALUK_FRANCHISE`
* `SHOPKEEPER`
* `VENDOR`
* `USER`
* `DELIVERY_PARTNER`
* `HUB_STAFF`

Permissions are checked via `authorize` middleware, which checks if `req.user.role` matches the allowed role list (e.g., `ADMIN` or `SUPER_ADMIN`).

## 5. Missing Management Modules
While basic User and Vendor management exists, the admin control center is currently missing management and analytics APIs for:
* **Shops** & **Franchises**
* **KYC Documents** (inspection, approvals)
* **Subscriptions** & **Subscription Plans**
* **MLM Commissions**
* **Settlements**
* **Fulfillment & Delivery**
* **Coupons & Campaigns**
* **Fair Coins Ledger**
* **Comprehensive Multi-Timeframe Analytics**
* **Operational Alerts**
* **Audit Log Search API** (filtered and paginated)
