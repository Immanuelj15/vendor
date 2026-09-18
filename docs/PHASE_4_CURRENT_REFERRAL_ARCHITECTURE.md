# Audit Report: Current Referral Architecture (Phase 4)

This document provides a detailed technical audit of the referral and MLM (Multi-Level Marketing) architecture in the Babu Super Market / FairKart platform prior to the Phase 4 implementation.

## 1. Schema Analysis

### User Model (`server/src/models/User.js`)
- `referredBy`: A reference to the parent/referrer User (`mongoose.Schema.Types.ObjectId`).
- `referralPath`: An array of User ObjectIds (`[mongoose.Schema.Types.ObjectId]`). 
  - **Representation**: It stores the full chronological chain of ancestors from the root of the tree down to the parent. For a user at depth $N$ in the tree, this array contains the preceding $N-1$ ancestors in chronological order.
  - **Extension**: There is no length limit imposed at the schema level.

### Referral Model (`server/src/models/Referral.js`)
- `userId`: Referrer (Upline) User ObjectId.
- `referredUserId`: Referred (Downline) User ObjectId.
- `level`: Number indicating the distance/depth (1 = Direct Upline, 2 = Grandparent Upline, 3 = Great-Grandparent Upline).
  - **Limits**: Configured with `{ min: 1, max: 10 }` in the schema.
- **Constraints**: Compound unique index on `{ userId: 1, referredUserId: 1 }` prevents duplicate relationships between any two users.

### ReferralReward Model (`server/src/models/ReferralReward.js`)
- Stores rewards (e.g. Fair Coins or commission percentages) earned by referrers when downlines register/purchase.
- Attributes: `userId` (recipient), `sourceUserId` (triggering downline), `level` (depth), `rewardType`, `rewardValue`, `status` (`PENDING`, `CREDITED`, `CANCELLED`).

### Commission Model (`server/src/models/Commission.js`)
- Tracks purchase-based commissions:
  - `type`: `VENDOR_PLATFORM_COMMISSION` or `MLM_UPLINE_COMMISSION`.
  - `recipientUserId`: Recipient of the commission (upline user).
  - `commissionPercentage`, `commissionAmount`, `status` (`PENDING`, `PAID`, `CANCELLED`).

---

## 2. Traversal & Query Behavior

### Current Traversal Method
The system currently traverses the hierarchy in `mlmRewardService.getUpline(userId, maxLevels = 3)` by performing a sequential loop:
1. Load current user: `await User.findById(currentUserId)`.
2. Retrieve `referredBy`.
3. Load referrer: `await User.findById(referredBy)`.
4. Update `currentUserId = referrer._id` and repeat up to `maxLevels`.

This is a classic **N+1 query pattern**. For 3 levels, it executes up to 6 database reads. Expanding this to 9 levels would generate up to 18 reads per transaction.

### Tree Traversal (`buildReferralTree`)
The current tree fetching method:
- Fetch Level 1 downline directly via `Referral.find({ userId, level: 1 })`.
- Fetch Level 2 by doing a `$in` query with Level 1 User IDs for `level: 1` downlines.
- Fetch Level 3 by doing a `$in` query with Level 2 User IDs for `level: 1` downlines.

While this works, it hardcodes three queries and is not generalized for a dynamic or larger depth (such as 9 levels).

---

## 3. Findings & Implementation Decisions for Phase 4

1. **Ancestor Representation**: The `referralPath` array in the `User` model is fully capable of representing all ancestors of a user up to 9 levels and beyond. It is chronologically ordered from the root of the tree to the direct referrer.
2. **O(1) Traversal Path**:
   - Instead of running N+1 loop queries to construct the upline, we can directly compute the 9 ancestors using the `referralPath` array of the user, which is populated during registration.
   - For an existing user, we can retrieve their `referralPath` in one query, then fetch all those user profiles using a single `$in` query.
3. **Idempotency Protection**: We must use `updateOne` with `{ upsert: true }` in the migration and database creation scripts to guarantee that duplicate referral links or re-runs of registration do not pollute the database with duplicate levels or rows.
4. **Independent Shop Attribution**: The referral tree (sponsorship) and shop attribution are completely separate. The `User` model will contain `attributedShopId` but the authoritative record resides in the dedicated `CustomerShopAttribution` collection.
