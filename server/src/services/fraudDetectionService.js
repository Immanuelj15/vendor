import { OfflineBill } from '../models/OfflineBill.js';

export const fraudDetectionService = {
  
  async checkDuplicateBill(payload) {
    const flags = [];
    
    // 1. Check exact bill number + store name + date
    const startOfDay = new Date(payload.billDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(payload.billDate);
    endOfDay.setHours(23, 59, 59, 999);

    const duplicateMatch = await OfflineBill.findOne({
      billNumber: payload.billNumber,
      storeName: { $regex: new RegExp(`^${payload.storeName}$`, 'i') }, // Case insensitive match
      billDate: { $gte: startOfDay, $lte: endOfDay }
    });

    if (duplicateMatch) {
      if (duplicateMatch.customerId.toString() === payload.customerId.toString()) {
        flags.push('DUPLICATE_OWN_BILL');
      } else {
        flags.push('CROSS_CUSTOMER_DUPLICATE_BILL');
      }
    }

    // 2. Check excessive submissions by user today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaySubmissions = await OfflineBill.countDocuments({
      customerId: payload.customerId,
      createdAt: { $gte: todayStart }
    });

    if (todaySubmissions > 5) {
      flags.push('EXCESSIVE_DAILY_SUBMISSIONS');
    }

    return flags;
  }
};
