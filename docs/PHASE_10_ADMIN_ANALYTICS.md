# Phase 10 — Admin Control Center, Analytics, and Observability Manual

This manual details the architecture, configuration parameters, observability logs, health diagnostic endpoints, and admin portal capabilities implemented in Phase 10.

---

## 1. Administrative Roles and Permissions
The platform distinguishes between two administration tiers:
* **SUPER_ADMIN**: Full access to settings modification, database audit searches, and financial mutations (including settlement reversals).
* **ADMIN**: Access to analytics dashboard metrics, shop approvals, kyc documents reviews, and regular user/vendor status updates.

Role checks are strictly enforced via the `authorize` role middleware on all router instances.

---

## 2. API Endpoints Reference

### Operational Diagnostics
* `GET /api/health`: System status summary.
* `GET /api/health/liveness`: Liveness probe.
* `GET /api/health/readiness`: Readiness probe measuring MongoDB latency.

### Administrative Console
* `GET /api/admin/metrics`: Real-time dashboard counts.
* `GET /api/admin/alerts`: Active operational system warnings.
* `GET /api/admin/settings`: Retrieve current platform settings.
* `POST /api/admin/settings`: Update settings (validates constraints).
* `GET /api/admin/audit-logs`: Paginated search with actor/action/resource filters.

### Data Analytics
* `GET /api/admin/analytics/revenue`: Sales, discounts, and payments analytics.
* `GET /api/admin/analytics/orders`: Order volumes and status trends.
* `GET /api/admin/analytics/customers`: Growth and repeat customer counts.
* `GET /api/admin/analytics/vendors`: Vendor catalog earnings and commission counts.
* `GET /api/admin/analytics/shops`: Shop attribution QR codes metrics.
* `GET /api/admin/analytics/franchises`: Territiorial scoped franchise sales.
* `GET /api/admin/analytics/kyc`: KYC review rates.
* `GET /api/admin/analytics/subscriptions`: Subscriptions expiry distributions.
* `GET /api/admin/analytics/commissions`: MLM commissions distribution.
* `GET /api/admin/analytics/settlements`: Vendor withdrawal distributions.
* `GET /api/admin/analytics/fair-coins`: Coins ledger flow metrics.
* `GET /api/admin/analytics/products`: Low stock catalogs.
* `GET /api/admin/analytics/coupons`: Coupon usage and savings.
* `GET /api/admin/analytics/campaigns`: Multiplier campaign status counts.
* `GET /api/admin/analytics/fulfillments`: Package processing rates.
* `GET /api/admin/analytics/deliveries`: Dispatch success rates.

### Streaming CSV Exports
* `GET /api/admin/exports/orders`
* `GET /api/admin/exports/payments`
* `GET /api/admin/exports/commissions`
* `GET /api/admin/exports/settlements`
* `GET /api/admin/exports/users`

---

## 3. Scheduled Jobs & Concurrency Locking
* **Subscription Expiry Sync**: Runs every 12 hours. Identifies expiring subscriptions, sends alerts once using deduplication, and deactivates expired shops/franchises past grace periods.
* **Failed Settlement Monitor**: Runs every 12 hours. Scans for stuck pending withdrawals and raises warnings.
* **Locking**: Employs local mutex flag states to protect single-instance triggers. For multi-instance servers, distributed locks should be introduced in a future phase.

---

## 4. Observability and Request Correlation
Every incoming request is tagged with a unique `requestId` via correlation headers.
* Request log template: `[TIMESTAMP] [reqId:UUID] METHOD PATH Status:CODE - DURATIONms`
* Sensitive fields (passwords, JWTs, transaction tokens) are automatically filtered.
* Production error logs suppress database trace details and stack outputs.
