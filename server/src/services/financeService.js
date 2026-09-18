import { Order } from '../models/Order.js';
import { VendorOrder } from '../models/VendorOrder.js';
import { Vendor } from '../models/Vendor.js';
import { CommissionRule } from '../models/CommissionRule.js';
import { Commission } from '../models/Commission.js';
import { VendorLedger } from '../models/VendorLedger.js';
import { PlatformLedger } from '../models/PlatformLedger.js';
import { VendorSettlement } from '../models/VendorSettlement.js';
import { Settings } from '../models/Settings.js';
import { moneyUtils } from '../utils/moneyUtils.js';
import mongoose from 'mongoose';

export const financeService = {
  /**
   * Processes the financial allocation for a PAID master order.
   * Calculates commission, creates ledger entries, and initiates the vendor settlement lifecycle.
   */
  async allocateOrderFinances(orderId, session = null) {
    const opts = session ? { session } : {};
    
    let orderQuery = Order.findById(orderId);
    if (session) orderQuery = orderQuery.session(session);
    const order = await orderQuery;
    if (!order) throw new Error('Order not found');
    
    if (order.paymentStatus !== 'PAID') {
      throw new Error('Finances can only be allocated for PAID orders');
    }

    // Get suborders (VendorOrders)
    let subordersQuery = VendorOrder.find({ parentOrderId: orderId });
    if (session) subordersQuery = subordersQuery.session(session);
    const suborders = await subordersQuery;
    
    if (suborders.length === 0) {
      return;
    }

    // Find active commission rule
    let ruleQuery = CommissionRule.findOne({ status: 'ACTIVE' }).sort({ createdAt: -1 });
    if (session) ruleQuery = ruleQuery.session(session);
    const rule = await ruleQuery;
    const ruleRate = rule && rule.commissionType === 'PERCENTAGE' ? rule.rate : 5; // default 5%
    const ruleId = rule ? rule._id : null;

    let settingQuery = Settings.findOne({ key: 'SETTLEMENT_HOLD_DAYS' });
    if (session) settingQuery = settingQuery.session(session);
    const setting = await settingQuery;
    const holdDays = setting && !isNaN(Number(setting.value)) ? Number(setting.value) : 7;

    let adminQuery = mongoose.model('User').findOne({ role: 'SUPER_ADMIN' });
    if (session) adminQuery = adminQuery.session(session);
    const adminUser = await adminQuery;
    const adminUserId = adminUser ? adminUser._id : null;

    for (const suborder of suborders) {
      // Skip if settlement already exists for this suborder (idempotency)
      let existingSettlementQuery = VendorSettlement.findOne({ suborderId: suborder._id });
      if (session) existingSettlementQuery = existingSettlementQuery.session(session);
      const existingSettlement = await existingSettlementQuery;
      if (existingSettlement) continue;

      let vendorQuery = Vendor.findById(suborder.vendorId);
      if (session) vendorQuery = vendorQuery.session(session);
      const vendor = await vendorQuery;
      if (!vendor) continue;

      const grossAmount = suborder.subtotal;
      
      // Calculate platform commission using paise precision
      const platformCommission = moneyUtils.calculatePercentage(grossAmount, ruleRate);
      const netPayable = moneyUtils.subtractMoney(grossAmount, platformCommission);

      // Update Suborder fields with final numbers
      suborder.platformCommission = platformCommission;
      suborder.vendorEarning = netPayable;
      await suborder.save(opts);

      // Create Commission record
      if (adminUserId && platformCommission > 0) {
        await Commission.create([{
          orderId: order._id,
          suborderId: suborder._id,
          type: 'PLATFORM_COMMISSION',
          recipientUserId: adminUserId, // Admin receives the platform commission
          vendorId: vendor._id,
          ruleSnapshotId: ruleId,
          orderAmount: grossAmount,
          commissionPercentage: ruleRate,
          commissionAmount: platformCommission,
          status: 'PENDING'
        }], opts);
      }

      // Ledger Entry 1: Gross Sale Credit to Vendor
      const newVendorBalance1 = moneyUtils.addMoney(vendor.balance, grossAmount);
      await VendorLedger.create([{
        vendorId: vendor._id,
        orderId: order._id,
        suborderId: suborder._id,
        transactionType: 'SALE',
        credit: grossAmount,
        debit: 0,
        balanceSnapshot: newVendorBalance1,
        description: `Gross sale for suborder ${suborder.subOrderNumber}`
      }], opts);
      vendor.balance = newVendorBalance1;

      // Ledger Entry 2: Platform Commission Debit from Vendor
      const newVendorBalance2 = moneyUtils.subtractMoney(vendor.balance, platformCommission);
      if (platformCommission > 0) {
        await VendorLedger.create([{
          vendorId: vendor._id,
          orderId: order._id,
          suborderId: suborder._id,
          transactionType: 'PLATFORM_COMMISSION',
          credit: 0,
          debit: platformCommission,
          balanceSnapshot: newVendorBalance2,
          description: `Platform commission for suborder ${suborder.subOrderNumber}`
        }], opts);
        vendor.balance = newVendorBalance2;

        // Ledger Entry 3: Double-entry Platform Ledger Record (HIGH-03)
        let latestPlatformRecordQuery = PlatformLedger.findOne().sort({ createdAt: -1 });
        if (session) latestPlatformRecordQuery = latestPlatformRecordQuery.session(session);
        const latestPlatformRecord = await latestPlatformRecordQuery;
        const currentPlatformBalance = latestPlatformRecord?.balanceSnapshot || 0;
        const nextPlatformBalance = moneyUtils.addMoney(currentPlatformBalance, platformCommission);

        await PlatformLedger.create([{
          transactionId: `PL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
          type: 'ORDER_COMMISSION',
          sourceEntityType: 'ORDER',
          sourceEntityId: order._id.toString(),
          credit: platformCommission,
          debit: 0,
          balanceSnapshot: nextPlatformBalance,
          description: `5% Platform Commission from Order ${suborder.subOrderNumber} (Vendor: ${vendor.storeName})`,
          metadata: {
            orderId: order._id,
            vendorId: vendor._id,
            suborderId: suborder._id,
            grossAmount,
            commissionRate: ruleRate,
          },
        }], opts);
      }

      // Update Vendor Balance & Sales
      vendor.totalSales = moneyUtils.addMoney(vendor.totalSales || 0, grossAmount);
      await vendor.save(opts);

      // Create Settlement with 7 day hold
      const eligibleDate = new Date();
      eligibleDate.setDate(eligibleDate.getDate() + holdDays);

      await VendorSettlement.create([{
        vendorId: vendor._id,
        suborderId: suborder._id,
        grossAmount: grossAmount,
        platformCommission: platformCommission,
        networkCommission: 0,
        otherDeductions: 0,
        netPayable: netPayable,
        status: 'ON_HOLD',
        eligibleAt: eligibleDate
      }], opts);
    }
  }
};
