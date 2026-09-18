import { OfflineBill } from '../models/OfflineBill.js';
import { OfflineBillStatusHistory } from '../models/OfflineBillStatusHistory.js';
import { BillRewardRule } from '../models/BillRewardRule.js';
import { BillReward } from '../models/BillReward.js';
import { superCoinService } from './superCoinService.js';
import { fraudDetectionService } from './fraudDetectionService.js';
import { premiumService } from './premiumService.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const offlineBillService = {
  
  async submitBill(customerId, payload) {
    const { billNumber, billDate, storeName, purchaseAmount, fileUrl, storePhone, storeAddress } = payload;
    
    // 1. Age Validation
    const billDateObj = new Date(billDate);
    const now = new Date();
    
    if (billDateObj > now) {
      throw new ApiError(400, 'Bill date cannot be in the future', ERROR_CODES.BAD_REQUEST);
    }

    const maxAgeDays = 30; // Configurable ideally via Settings
    const msDiff = now.getTime() - billDateObj.getTime();
    if (msDiff > (maxAgeDays * 24 * 60 * 60 * 1000)) {
      throw new ApiError(400, `Bill is too old. Maximum allowed age is ${maxAgeDays} days.`, ERROR_CODES.BAD_REQUEST);
    }

    // 2. Fraud / Duplicate Check
    const flags = await fraudDetectionService.checkDuplicateBill({
      customerId,
      billNumber,
      storeName,
      billDate: billDateObj,
    });

    if (flags.includes('DUPLICATE_OWN_BILL')) {
      throw new ApiError(400, 'You have already submitted this exact bill.', ERROR_CODES.BAD_REQUEST);
    }

    // 3. Create Bill
    const status = flags.length > 0 ? 'UNDER_REVIEW' : 'SUBMITTED';

    const bill = await OfflineBill.create({
      customerId,
      billNumber,
      billDate: billDateObj,
      storeName,
      storePhone,
      storeAddress,
      purchaseAmount,
      fileUrl,
      status,
      flags,
    });

    await OfflineBillStatusHistory.create({
      billId: bill._id,
      previousStatus: 'DRAFT',
      newStatus: status,
      reason: flags.length > 0 ? 'Flagged by Fraud Detection' : 'Initial submission',
    });

    return bill;
  },

  async approveBill(billId, adminId) {
    const bill = await OfflineBill.findById(billId);
    if (!bill) throw new ApiError(404, 'Bill not found', ERROR_CODES.NOT_FOUND);

    if (bill.status === 'APPROVED') throw new ApiError(400, 'Bill is already approved', ERROR_CODES.BAD_REQUEST);
    
    // Get active rule
    const rule = await BillRewardRule.findOne({ status: 'ACTIVE' }).sort({ createdAt: -1 });
    if (!rule) throw new ApiError(400, 'No active reward rule configured', ERROR_CODES.BAD_REQUEST);

    if (bill.purchaseAmount < rule.minimumPurchaseAmount) {
      throw new ApiError(400, `Purchase amount does not meet minimum requirement of ${rule.minimumPurchaseAmount}`, ERROR_CODES.BAD_REQUEST);
    }

    // Calculate Reward
    let rawReward = 0;
    if (rule.rewardType === 'PER_AMOUNT_SUPER_COINS') {
      rawReward = Math.floor(bill.purchaseAmount / rule.basis) * rule.rate;
    } else if (rule.rewardType === 'PERCENTAGE') {
      rawReward = (bill.purchaseAmount * rule.rate) / 100;
    } else if (rule.rewardType === 'FIXED_SUPER_COINS') {
      rawReward = rule.rate;
    }

    // Premium multiplier
    const isPremium = await premiumService.isCustomerPremium(bill.customerId);
    if (isPremium && rule.premiumMultiplier > 1) {
      rawReward = rawReward * rule.premiumMultiplier;
    }

    const finalAmount = Math.min(rawReward, rule.maxReward);

    if (finalAmount <= 0) {
      throw new ApiError(400, 'Calculated reward is zero.', ERROR_CODES.BAD_REQUEST);
    }

    // State Mutation
    bill.status = 'APPROVED';
    bill.approvedAt = new Date();
    bill.reviewedBy = adminId;
    await bill.save();

    await OfflineBillStatusHistory.create({
      billId: bill._id,
      previousStatus: bill.status,
      newStatus: 'APPROVED',
      changedBy: adminId,
    });

    // Save Reward Record
    let rewardRecord;
    try {
      rewardRecord = await BillReward.create({
        billId: bill._id,
        customerId: bill.customerId,
        ruleId: rule._id,
        rewardType: rule.rewardType,
        purchaseAmount: bill.purchaseAmount,
        calculatedAmount: rawReward,
        finalAmount: finalAmount,
        status: 'PENDING',
        ruleSnapshot: rule.toObject(),
      });
    } catch (e) {
      if (e.code === 11000) {
        throw new ApiError(409, 'Reward already issued for this bill.', ERROR_CODES.CONFLICT);
      }
      throw e;
    }

    // Credit Coins
    const tx = await superCoinService.creditCoins({
      userId: bill.customerId,
      amount: finalAmount,
      type: 'CREDIT',
      source: 'OFFLINE_BILL_REWARD',
      referenceId: `BILL:${bill._id.toString()}`,
      description: `Reward for approved bill ${bill.billNumber}`,
    });

    rewardRecord.status = 'CREDITED';
    rewardRecord.superCoinTransactionId = tx._id;
    await rewardRecord.save();

    return { bill, reward: rewardRecord };
  },

  async rejectBill(billId, adminId, reason) {
    if (!reason) throw new ApiError(400, 'Rejection reason is required', ERROR_CODES.BAD_REQUEST);

    const bill = await OfflineBill.findById(billId);
    if (!bill) throw new ApiError(404, 'Bill not found', ERROR_CODES.NOT_FOUND);

    if (bill.status === 'APPROVED') {
       throw new ApiError(400, 'Cannot reject an already approved bill. Use reversal process.', ERROR_CODES.BAD_REQUEST);
    }

    const oldStatus = bill.status;
    bill.status = 'REJECTED';
    bill.rejectedAt = new Date();
    bill.reviewedBy = adminId;
    bill.rejectionReason = reason;
    await bill.save();

    await OfflineBillStatusHistory.create({
      billId: bill._id,
      previousStatus: oldStatus,
      newStatus: 'REJECTED',
      reason,
      changedBy: adminId,
    });

    return bill;
  }
};
