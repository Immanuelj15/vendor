import { Subscription } from '../models/Subscription.js';
import { Shop } from '../models/Shop.js';
import { Shopkeeper } from '../models/Shopkeeper.js';
import { Franchise } from '../models/Franchise.js';
import { Settings } from '../models/Settings.js';
import { notificationService } from '../services/notificationService.js';

export const runSubscriptionExpiryJob = async () => {
  console.log(`[${new Date().toISOString()}] [JOB:SubscriptionExpiry] Starting...`);
  
  try {
    // 1. Fetch config
    const subConfigSetting = await Settings.findOne({ key: 'SUBSCRIPTION_CONFIG' });
    const gracePeriodDays = subConfigSetting?.value?.gracePeriodDays ?? 3;
    const alertDays = subConfigSetting?.value?.expiryAlertDays ?? 7;

    // 2. Alert approaching expiration
    const warningThreshold = new Date();
    warningThreshold.setDate(warningThreshold.getDate() + alertDays);
    
    const warningSubs = await Subscription.find({
      status: 'ACTIVE',
      endDate: { $gte: new Date(), $lte: warningThreshold }
    });

    console.log(`[JOB:SubscriptionExpiry] Found ${warningSubs.length} subscriptions approaching expiration`);
    for (const sub of warningSubs) {
      const daysLeft = Math.ceil((sub.endDate - new Date()) / (1000 * 60 * 60 * 24));
      
      const dedupeKey = `SUB_ALERT:${sub._id.toString()}:${sub.endDate.toISOString().split('T')[0]}`;
      
      await notificationService.createNotification({
        userId: sub.ownerUserId,
        title: 'Subscription Expiring Soon',
        message: `Your ${sub.entityType} subscription will expire in ${daysLeft} days on ${sub.endDate.toLocaleDateString()}. Please renew soon.`,
        type: 'SYSTEM',
        priority: 'HIGH'
      }, { dedupeKey });
    }

    // 3. Mark expired active subscriptions (respecting grace periods)
    const graceThreshold = new Date();
    graceThreshold.setDate(graceThreshold.getDate() - gracePeriodDays);

    const expiredSubs = await Subscription.find({
      status: 'ACTIVE',
      endDate: { $lt: graceThreshold }
    });

    console.log(`[JOB:SubscriptionExpiry] Found ${expiredSubs.length} subscriptions expired past grace period`);
    for (const sub of expiredSubs) {
      sub.status = 'EXPIRED';
      await sub.save();

      // Deactivate dependent shops
      if (sub.entityType === 'SHOP') {
        const shop = await Shop.findByIdAndUpdate(sub.entityId, { status: 'EXPIRED' });
        if (shop) {
          await Shopkeeper.findByIdAndUpdate(shop.shopkeeperId, { status: 'EXPIRED' });
        }
      } else if (sub.entityType === 'FRANCHISE') {
        await Franchise.findByIdAndUpdate(sub.entityId, { status: 'EXPIRED' });
      }

      await notificationService.createNotification({
        userId: sub.ownerUserId,
        title: 'Subscription Expired',
        message: `Your ${sub.entityType} subscription has expired. Linked services are now deactivated.`,
        type: 'SYSTEM',
        priority: 'HIGH'
      });
    }

    console.log(`[JOB:SubscriptionExpiry] Finished successfully`);
  } catch (err) {
    console.error(`[JOB:SubscriptionExpiry] Error encountered:`, err);
  }
};
