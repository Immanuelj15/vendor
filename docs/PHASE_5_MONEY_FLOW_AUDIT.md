# Phase 5 Money Flow Audit

This document describes the financial, coin, and commission flows in the FairKart platform before the implementation of the Phase 5 Commission and Settlement Engine.

## 1. Audit Findings (Task 1 Questions)

### 1. Where money is calculated
- **Order creation** (`orderService.createOrder`): Calculates order items, coupon discounts, coin discount amounts, and the final grand total/total.
- **Payment order initialization** (`paymentService.createPaymentOrder`): Computes the Razorpay payment amount in paise (`Math.round(total * 100)`).
- **Payment verification / COD processing** (`paymentService.verifyPaymentSignature` and `orderService.createOrder`): Calculates vendor platform commission and vendor earnings when split orders are initialized.

### 2. Where Fair Coins are calculated
- **Purchase reward calculation** (`fairCoinService.processPurchaseReward`): Standard reward formula is `Math.floor(totalPurchaseAmount / 100) * 1` (10 Fair Coins per ₹1000 spent).
- **Coin discount calculation** (`orderService.createOrder`): Converts redeemed coins to INR (`coinDiscount = Math.floor(fairCoinsToRedeem / 10)`).
- **Registration rewards** (`mlmRewardService.processReferralRegistrationRewards`): Calculates base registration and referral rewards.

### 3. Where vendor commission is calculated
- Split calculations are processed in two separate flows:
  - **COD order creation**: Inside `orderService.createOrder` (lines 127-129).
  - **Online payment verification**: Inside `paymentService.verifyPaymentSignature` (lines 167-169).
  - Both places calculate:
    ```javascript
    const commissionRate = vendor?.commissionRate || 10;
    const platformCommission = Math.round((vSubtotal * commissionRate) / 100);
    const vendorEarning = vSubtotal - platformCommission;
    ```

### 4. Where MLM commission is calculated
- Calculated in `mlmRewardService.processPurchaseCommission(buyerUserId, orderId, orderTotal)`:
  - Traverses the upline using `getUpline(buyerUserId, maxLevels)` up to 3 levels by default (configured via the `MLM_CONFIG` settings key).
  - Computes:
    ```javascript
    const commissionAmount = Math.round((orderTotal * levelConfig.percentage) / 100);
    ```
  - MLM commissions are paid out as Fair Coins via `fairCoinService.creditCoins` under transaction type `BONUS`, source `MLM_LEVEL_{level}_PURCHASE_COMMISSION`.

### 5. Where shop attribution exists
- Stored as a reference on:
  - `User.attributedShopId`
  - `Order.attributedShopId`
  - Authoritatively represented in the `CustomerShopAttribution` collection.
  - Resolved on checkout in `orderService.createOrder` via `CustomerShopAttribution.findOne({ customerUserId: userId, status: 'ACTIVE' })`.

### 6. Where franchise information exists
- Defined in the `Franchise` model (STATE, DISTRICT, TALUK).
- Shops are associated with a franchise via `Shop.talukFranchiseId`.
- Franchises have a geographic scope mapping to territories (via `Territory` model, which links Taluk -> District -> State).

### 7. Whether any commission is currently credited during order creation
- **Yes, for COD payments**: `orderService.createOrder` immediately creates sub-orders, credits vendor balances directly, debits buyer's coins used, and triggers MLM commission (`mlmRewardService.processPurchaseCommission`) and buyer purchase rewards (`fairCoinService.processPurchaseReward`).
- **No, for Razorpay/online payments**: Non-COD orders are initialized with payment status `PENDING`, and no commissions are paid out during creation.

### 8. Whether any commission is credited during payment verification
- **Yes, for online payments**: Once Razorpay payment verification or webhook triggers `paymentService.verifyPaymentSignature`, it runs sub-order splits, updates vendor balances, debits redeemed coins, and credits upline MLM commissions and buyer rewards.

### 9. Whether webhook processing can duplicate payouts
- **Yes**: Currently, both the Razorpay callback and webhook route (`/payments/webhook`) call `paymentService.verifyPaymentSignature` and converge on the same block of code.
- Although `verifyPaymentSignature` contains check `if (order.paymentStatus === 'PAID') { return payment; }` and checks if the payment model is already captured, there is no database transaction or lock.
- Under high concurrency (e.g. duplicate webhook triggers or user verifying signature simultaneously with a webhook response), both threads could read `order.paymentStatus` as `PENDING` at the same time, leading to duplicate sub-orders, double-credits to vendor balances, double MLM payouts, and multiple coin credits.

### 10. Where wallet balances are updated in multiple places
- **Yes**:
  - User cached balance is synced inside `fairCoinService.creditCoins` and `debitCoins` via `User.findByIdAndUpdate(userId, { fairCoinBalance })` alongside updates to `Wallet.balance`.
  - Vendor balances are updated directly inside `orderService.createOrder` and `paymentService.verifyPaymentSignature` via `vendor.balance += vendorEarning; await vendor.save();`.
  - These updates do not utilize MongoDB transactions, increasing the risk of data inconsistency if a crash occurs mid-write.

---

## 2. Commission Base Amount Definition (Task 3)

The audit of the codebase confirms that MLM commission is currently based on `orderTotal` (`order.total`), which represents the **discounted grand total** after applying coupons and Fair Coins discount:
```javascript
const grandTotal = Math.max(0, subtotal - couponDiscount - coinDiscount);
```

For the new Settlement Engine, we will define `commissionBaseAmount` authoritatively as the **discounted grand total** (`order.total`).
- For vendor platform commissions and vendor earnings, the base is the vendor's subtotal of items in the order (`vSubtotal`), excluding order-level coupon/coin discounts.
- Shop and Franchise override commissions will be computed relative to the `commissionBaseAmount` (`order.total`).
