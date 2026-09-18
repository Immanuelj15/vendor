# Phase 8 — Notification Audit

This document presents the findings from an audit of the existing notification architecture within the FairKart / Babu Super Market codebase.

## 1. Where notifications are currently created

Currently, notifications are only created from the backend services directory through `notificationService.createNotification`.
No controller creates notification documents directly, which respects the system's design guidelines.

Specific files invoking the service:
1. **`kycService.js`**: Triggers in-app notifications on submission and verification status updates.
2. **`subscriptionService.js`**: Triggers notifications on subscription activation, renewals, and expirations.
3. **`shopActivationService.js`**: Triggers shop activation and shop deactivation/inactivity notifications.
4. **`fulfillmentStatusService.js`**: Triggers customer notifications upon individual fulfillment status transitions.

## 2. Which events already create notifications

The following events already generate notifications:
- `KYC Submitted` (`KYC_SUBMITTED`)
- `KYC Approved` (`KYC_APPROVED`)
- `KYC Rejected` (`KYC_REJECTED`)
- `Subscription Activated` / `Subscription Renewed`
- `Subscription Expired`
- `Shop Activated`
- `Shop Inactive`
- `Fulfillment Status Updates` (e.g. `Order Update: PROCESSING`)

## 3. Which events are missing

The following domain events are currently missing notification triggers:
- **Order Events**: Order placement confirmed (`ORDER_CONFIRMED`), cancelled (`ORDER_CANCELLED`), packed (`ORDER_PACKED`), dispatched (`ORDER_DISPATCHED`), out for delivery (`ORDER_OUT_FOR_DELIVERY`), delivered (`ORDER_DELIVERED`).
- **Payment Events**: Successful payments (`PAYMENT_SUCCESS`), failed payments (`PAYMENT_FAILED`).
- **Delivery Events**: Delivery driver assigned (`DELIVERY_ASSIGNED`), delivery failed (`DELIVERY_FAILED`), new delivery assignment alerts for drivers, driver acceptance confirmation, vendor order fulfillment notices, and hub operational handoffs.
- **Commission Events**: Commission paid (`COMMISSION_EARNED`/`COMMISSION_PAID`), commission reversals on cancelled orders.
- **Fair Coins Events**: Awarding/crediting coins (purchase reward, referral join, spin reward, admin credit), coin redemptions (`COIN_DEBITED`).
- **Referral Events**: Sponsor notifications when a referred user joins (`REFERRAL_JOINED`).
- **Spin Events**: Reward notifications after spin wheel plays (`SPIN_REWARD`).
- **Shop Events**: Approval, suspension, QR codes activated/deactivated.
- **Return Events**: Returns requested, approved, rejected, and completed.

## 4. Whether duplicate notifications are possible

Yes, duplicate notifications are currently possible.
There is no duplication protection or `dedupeKey` implemented in the existing `Notification` schema or `notificationService.createNotification`. Repeated gateway webhooks, retry actions, or webhook failures will create duplicate rows in the database.

## 5. Whether unread counts are implemented

Unread counts are implemented in `notificationService.getNotifications` via:
```javascript
const unreadCount = await Notification.countDocuments({ userId, isRead: false });
```
However, there is no standalone `getUnreadCount` method for quick API polling/header counts.

## 6. Whether notification pagination exists

Yes, simple pagination exists in `notificationService.getNotifications` using Mongoose `.skip()` and `.limit()`.

## 7. Whether notifications are user-scoped

Yes, all notifications are user-scoped. The service queries enforce `userId` checks:
```javascript
const notifications = await Notification.find({ userId })
```
And updates require matching user ID:
```javascript
async markRead(userId, notificationId) {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { new: true }
  );
}
```

## 8. Whether email is already integrated

No, there is currently no email service or SMTP integration in the backend codebase. All notifications are strictly in-app records.
