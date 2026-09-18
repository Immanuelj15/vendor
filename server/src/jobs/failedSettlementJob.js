import { VendorWithdrawal } from '../models/VendorWithdrawal.js';

export const runFailedSettlementJob = async () => {
  console.log(`[${new Date().toISOString()}] [JOB:FailedSettlement] Starting...`);
  try {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 48);

    const stuckSettlements = await VendorWithdrawal.find({
      status: 'PENDING',
      createdAt: { $lt: cutoff }
    }).populate('vendorId');

    console.log(`[JOB:FailedSettlement] Found ${stuckSettlements.length} settlements pending for >48h`);
    for (const st of stuckSettlements) {
      console.warn(`[JOB:FailedSettlement] WARNING: Settlement ID ${st._id} for Vendor ${st.vendorId?.storeName || 'N/A'} is stuck in PENDING.`);
    }

    console.log(`[JOB:FailedSettlement] Finished successfully`);
  } catch (err) {
    console.error(`[JOB:FailedSettlement] Error encountered:`, err);
  }
};
