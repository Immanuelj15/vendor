# Phase 9: Commerce, Discovery, & Promotion Audit Report

This report details the audit of the current product, review, coupon, wishlist, and campaign architectures of Babu Super Market / FairKart, providing the baseline for Phase 9 implementation.

---

## 1. Product Search & Catalog Discovery

*   **Current Search**: Driven by Mongoose `$text` search queries (`query.$text = { $search: search }`) hitting the `{ name: "text", description: "text", tags: "text" }` index.
*   **Filtering**:
    *   **Category**: Matches the category slug to find the `categoryId`.
    *   **Brand**: Matches the brand slug to find the `brandId`.
    *   **Vendor**: Matches vendor object ID.
    *   **Price**: Checks `minPrice` and `maxPrice` against `price` (but does not check `discountPrice` or variant-specific prices).
*   **Sorting**: Supports `price_asc`, `price_desc`, `rating`, and `popular`. Defaults to `newest` (`createdAt: -1`).
*   **Pagination**: Handled via standard Mongoose `.skip(skip).limit(limit)`.

---

## 2. Product Status & Approval

*   **Allowed Statuses**: `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED`.
*   **Approval Flow**:
    *   Currently, standard catalog views query `{ status: "APPROVED" }`.
    *   There are no dedicated admin approval routes (`GET /api/admin/products` or `PUT /api/admin/products/:id/status`) to moderate vendor products.
    *   There is no Audit Log generated on status transitions, nor vendor notifications wired up.

---

## 3. Pricing & Discounts

*   **Effective Price**: Computed as `discountPrice > 0 ? discountPrice : price`.
*   **Current Variant Pricing**: Not evaluated during cart calculations or checkout revalidation.
*   **Revalidation**: Currently, checkout checks base prices, but does not use a single centralized price calculation helper, resulting in inline logic duplication across the cart and order services.

---

## 4. Coupon System

*   **Existing Model**:
    *   `code` (Unique uppercase)
    *   `type` (`PERCENTAGE` or `FIXED`)
    *   `discountValue`
    *   `minPurchase`
    *   `maxDiscount`
    *   `usageLimit`
    *   `usedCount`
    *   `isActive`
*   **Limitations**:
    *   No category constraints (`applicableCategories`) are defined.
    *   No concurrency protection exists when updating `usedCount`.
    *   Coupons are currently validated in-line inside `cartService.js` and `orderService.js`.

---

## 5. Review & Rating System

*   **Existing Model**:
    *   Compound unique index `{ productId: 1, userId: 1 }` prevents multiple reviews by a single customer.
    *   Fields: `productId`, `userId`, `rating`, `title`, `comment`, `isVerifiedPurchase`.
*   **Missing Features**:
    *   No moderation statuses (`PENDING`, `APPROVED`, `REJECTED`).
    *   No aggregated distribution queries (e.g., Star ratings distribution).
    *   No verified purchase backend check (currently trusts input directly).
    *   No REST endpoints (`GET`, `POST`, `PUT`, `DELETE`) defined.

---

## 6. Wishlist System

*   **Existing Model**:
    *   `userId` (Unique ref)
    *   `products` (Array of Product refs)
*   **Status**: Exists. Needs to support clean frontend list updates, add-to-cart fallbacks, and handling unavailable states.

---

## 7. Campaign System

*   **Existing Model**:
    *   `title`, `description`, `multiplier`, `type` (`REFERRAL_BOOST`, `PURCHASE_BOOST`), `startDate`, `endDate`, `isActive`.
*   **Missing Features**:
    *   No service or evaluation engine (`campaignService.js`) to apply active multipliers dynamically.
    *   No campaign reward protection to avoid double-crediting.
    *   No admin creation/monitoring routes.
