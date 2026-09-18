import { EmailLog } from '../models/EmailLog.js';
import { User } from '../models/User.js';
import { templates } from '../templates/email/templates.js';

export const emailService = {
  /**
   * Generic, transaction-safe, asynchronous email sender with idempotency.
   */
  async sendEmail({ to, subject, html, text = '' }, dedupeKey = null) {
    // Process asynchronously (do not block the caller)
    setImmediate(async () => {
      try {
        if (dedupeKey) {
          // Check if already sent
          const existingLog = await EmailLog.findOne({ dedupeKey });
          if (existingLog) {
            console.log(`[Email Service] Duplicate skipped for key: ${dedupeKey}`);
            return;
          }

          // Create log immediately (pessimistic lock on key)
          await EmailLog.create({
            dedupeKey,
            recipientEmail: to,
            subject,
          });
        }

        // Output to console in dev/test environment
        console.log(`==================================================`);
        console.log(`✉️  EMAIL SENT SUCCESSFULLY`);
        console.log(`📬 To: ${to}`);
        console.log(`🏷️  Subject: ${subject}`);
        console.log(`🔑 DedupeKey: ${dedupeKey || 'none'}`);
        console.log(`==================================================`);
      } catch (err) {
        if (err.code === 11000) {
          console.log(`[Email Service] Concurrency race condition duplicate skipped for key: ${dedupeKey}`);
          return;
        }
        console.error('[Email Service] Async transmission failed:', err);
      }
    });
  },

  async sendOrderConfirmation(order) {
    try {
      const user = await User.findById(order.userId);
      if (!user || !user.email) return;

      const html = templates.orderConfirmation(order);
      const dedupeKey = `${order._id.toString()}:EMAIL_CONFIRMED`;

      await this.sendEmail({
        to: user.email,
        subject: `Order #${order.orderNumber} Confirmed`,
        html,
      }, dedupeKey);
    } catch (err) {
      console.error('[Email Service] sendOrderConfirmation failed:', err);
    }
  },

  async sendPaymentReceipt(payment, order) {
    try {
      const user = await User.findById(payment.userId);
      if (!user || !user.email) return;

      const orderNumber = order ? order.orderNumber : null;
      const html = templates.paymentSuccess(payment, orderNumber);
      const dedupeKey = `${payment._id.toString()}:EMAIL_PAYMENT_SUCCESS`;

      await this.sendEmail({
        to: user.email,
        subject: `Payment Receipt — ₹${(payment.amount / 100).toFixed(2)}`,
        html,
      }, dedupeKey);
    } catch (err) {
      console.error('[Email Service] sendPaymentReceipt failed:', err);
    }
  },

  async sendKycStatus(kyc, status, reason = '') {
    try {
      const user = await User.findById(kyc.ownerUserId);
      if (!user || !user.email) return;

      const isVerified = status === 'VERIFIED';
      const html = isVerified 
        ? templates.kycApproved(kyc)
        : templates.kycRejected(kyc, reason);

      const action = isVerified ? 'KYC_APPROVED' : 'KYC_REJECTED';
      const dedupeKey = `${kyc._id.toString()}:EMAIL_${action}`;

      await this.sendEmail({
        to: user.email,
        subject: isVerified ? 'KYC Verification Approved' : 'KYC Verification Rejected',
        html,
      }, dedupeKey);
    } catch (err) {
      console.error('[Email Service] sendKycStatus failed:', err);
    }
  },

  async sendSubscriptionStatus(subscription, status, details = {}) {
    try {
      const user = await User.findById(subscription.ownerUserId);
      if (!user || !user.email) return;

      let html = '';
      let subject = '';
      let actionKey = '';

      if (status === 'ACTIVATED') {
        html = templates.subscriptionActivated(subscription, details.isRenewal);
        subject = details.isRenewal ? 'Subscription Renewed Successfully' : 'Subscription Activated Successfully';
        actionKey = details.isRenewal ? 'RENEWAL' : 'ACTIVATION';
      } else if (status === 'EXPIRING') {
        html = templates.subscriptionExpiring(subscription, details.daysRemaining);
        subject = `Warning: Subscription Expiring in ${details.daysRemaining} days`;
        actionKey = `EXPIRING_${details.daysRemaining}`;
      } else if (status === 'EXPIRED') {
        html = templates.delivered(subscription); // Mock layout placeholder
        subject = 'Your Subscription Has Expired';
        actionKey = 'EXPIRED';
      }

      if (!html) return;

      const dedupeKey = `${subscription._id.toString()}:EMAIL_${actionKey}`;

      await this.sendEmail({
        to: user.email,
        subject,
        html,
      }, dedupeKey);
    } catch (err) {
      console.error('[Email Service] sendSubscriptionStatus failed:', err);
    }
  },

  async sendDeliveryUpdate(order, status) {
    try {
      const user = await User.findById(order.userId);
      if (!user || !user.email) return;

      let html = '';
      let subject = '';

      if (status === 'SHIPPED') {
        html = templates.orderShipped(order);
        subject = `Your Order #${order.orderNumber} Has Been Shipped`;
      } else if (status === 'OUT_FOR_DELIVERY') {
        html = templates.outForDelivery(order);
        subject = `Your Order #${order.orderNumber} is Out For Delivery Today`;
      } else if (status === 'DELIVERED') {
        html = templates.delivered(order);
        subject = `Your Order #${order.orderNumber} Has Been Delivered!`;
      }

      if (!html) return;

      const dedupeKey = `${order._id.toString()}:EMAIL_${status}`;

      await this.sendEmail({
        to: user.email,
        subject,
        html,
      }, dedupeKey);
    } catch (err) {
      console.error('[Email Service] sendDeliveryUpdate failed:', err);
    }
  }
};
