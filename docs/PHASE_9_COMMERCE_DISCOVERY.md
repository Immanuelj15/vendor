# Phase 9: Product Discovery, Reviews, Coupons, & Campaigns Documentation

This document describes the implementation architecture, API endpoints, design patterns, and validation rules established for the FairKart / Babu Super Market platform in Phase 9.

---

## 1. Product Status & Approvals Workflow

*   **Status Moderation**:
    *   Products default to `PENDING_APPROVAL` status upon vendor creation.
    *   Admins manage and filter catalog submissions via `GET /api/admin/products`.
    *   Admins approve or reject status using `PUT /api/admin/products/:id/status`.
*   **Audit Logging**:
    *   Updates write structured Audit Logs with previous and new states to ensure operational tracking.
*   **In-App Alerts**:
    *   Approval notifications are automatically created and pushed to the vendor's user profile in real-time.

---

## 2. Server-side Pricing & Revalidation

*   **Central Calculator**: Sourced in `priceService.getEffectiveProductPrice(product, variantSku)`.
*   **Variant Support**: Handles variant-specific sku price lookup and inventory bounds.
*   **Checkout Revalidation**:
    *   Inside `orderService.js` order placement and `cartService.js` cart retrieval, products are re-fetched from the database.
    *   If current prices differ from the customer's cart snapshot, checkouts are blocked with a controlled error telling the customer to review their cart.

---

## 3. Promotion Coupon Engine

*   **Category Exclusions**: Evaluated server-side using `applicableCategories` references. Cart items not matching applicable categories are excluded from discount calculations.
*   **Usage Control**:
    *   Upper limits cap discount amounts dynamically for percentage coupons (`maxDiscount`).
    *   Minimum order values (`minPurchase`) are verified against cart subtotal boundaries.
*   **Race-Condition Protection**:
    *   Usage counts are atomically reserved at checkout via `Coupon.findOneAndUpdate({ _id, usedCount: { $lt: usageLimit } }, { $inc: { usedCount: 1 } })` inside `couponService.js`, completely preventing limit breaches.

---

## 4. delivered Buyer Verified Reviews

*   **Eligibility Verification**:
    *   Customers are only allowed to submit reviews for products if they have a `DELIVERED` order containing the specific product.
*   **Anti-Spam Guard**:
    *   Compound unique index `{ productId: 1, userId: 1 }` prevents customers from submitting duplicate reviews.
*   **Aggregated Ratings Caches**:
    *   Upon moderation updates (`PUT /api/reviews/:id/moderate`), database average ratings and star distributions are aggregated and cached back to the Product document.

---

## 5. Campaign Boost Multipliers

*   **Coin Reward Multiplier**:
    *   Checks active `PURCHASE_BOOST` campaigns and multiplies Fair Coin rewards during payment confirmation.
*   **Deduplication & Idempotency**:
    *   Before crediting coins, `fairCoinService` queries for existing transactions of type `PURCHASE_REWARD` matching the order reference ID to prevent duplicate crediting.

---

## 6. Verification Results

All tests completed successfully:
*   ✔ Asserted Category & Brand catalog filters.
*   ✔ Asserted Product approval audits and alerts.
*   ✔ Asserted Variant pricing overrides.
*   ✔ Asserted Coupon exclusions & limits.
*   ✔ Asserted Delivered purchaser verification & ratings cache.
*   ✔ Asserted Multiplied coin boost idempotency.
