import { Payment } from '../models/Payment.js';
import { PaymentReconciliation } from '../models/PaymentReconciliation.js';

export const reconciliationService = {
  async reconcilePayments(startDate, endDate) {
    // 1. Fetch platform records
    const query = {
      status: { $in: ['COMPLETED', 'FAILED', 'PENDING'] },
      createdAt: { $gte: startDate, $lte: endDate }
    };
    
    const platformPayments = await Payment.find(query).lean();
    
    // 2. Mock Gateway API call
    // In a real scenario, this would be: await stripe.charges.list(...) or razorpay.payments.all(...)
    // Here we will generate a mock gateway response based on platform payments, 
    // occasionally injecting mismatches for testing purposes.
    
    const gatewayRecords = platformPayments.map((p, index) => {
      let gwAmount = p.amount;
      let gwStatus = p.status;
      
      // Inject some artificial mismatches
      if (index === 0 && p.status === 'COMPLETED') {
        gwAmount = p.amount - 10; // Amount mismatch
      } else if (index === 1 && p.status === 'COMPLETED') {
        gwStatus = 'FAILED'; // Status mismatch
      }

      return {
        transactionId: p.transactionId,
        amount: gwAmount,
        status: gwStatus,
        gateway: p.paymentMethod || 'MOCK_GATEWAY'
      };
    });

    // 3. Compare and flag
    const discrepancies = [];
    const matched = [];

    const gatewayMap = new Map(gatewayRecords.map(g => [g.transactionId, g]));

    // We will only insert new discrepancies if they don't already exist as OPEN
    for (const pp of platformPayments) {
      const gp = gatewayMap.get(pp.transactionId);

      let issue = null;
      let gwAmount = 0;
      let gwStatus = 'MISSING';

      if (!gp) {
        issue = 'MISSING_IN_GATEWAY';
      } else if (gp.amount !== pp.amount) {
        issue = 'AMOUNT_MISMATCH';
        gwAmount = gp.amount;
        gwStatus = gp.status;
      } else if (gp.status !== pp.status) {
        issue = 'STATUS_MISMATCH';
        gwAmount = gp.amount;
        gwStatus = gp.status;
      } else {
        matched.push(pp.transactionId);
        continue; // Perfectly matched
      }

      // Check if already logged
      const existing = await PaymentReconciliation.findOne({ transactionId: pp.transactionId, reconciliationStatus: { $ne: 'RESOLVED' } });
      if (!existing) {
        const rec = await PaymentReconciliation.create({
          paymentId: pp._id,
          transactionId: pp.transactionId,
          gatewayReference: gp ? gp.transactionId : '',
          internalAmount: pp.amount,
          gatewayAmount: gwAmount,
          internalStatus: pp.status,
          gatewayStatus: gwStatus,
          reconciliationStatus: issue
        });
        discrepancies.push(rec);
      }
    }

    return {
      totalAnalyzed: platformPayments.length,
      matchedCount: matched.length,
      discrepancyCount: discrepancies.length,
      discrepancies
    };
  }
};
