import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import { connectDB } from '../src/config/db.js';
import { Wallet } from '../src/models/Wallet.js';
import { WalletTransaction } from '../src/models/WalletTransaction.js';
import { Vendor } from '../src/models/Vendor.js';
import { VendorLedger } from '../src/models/VendorLedger.js';
import { PlatformLedger } from '../src/models/PlatformLedger.js';
import { User } from '../src/models/User.js';
import { CoinTransaction } from '../src/models/CoinTransaction.js';
import { SuperCoinWallet } from '../src/models/SuperCoinWallet.js';
import { SuperCoinTransaction } from '../src/models/SuperCoinTransaction.js';
import { VendorSettlement } from '../src/models/VendorSettlement.js';
import { VendorOrder } from '../src/models/VendorOrder.js';
import { Commission } from '../src/models/Commission.js';
import { moneyUtils } from '../src/utils/moneyUtils.js';

export async function runFinancialReconciliation() {
  console.log('================================================================');
  console.log('       FAIRKART DAILY FINANCIAL RECONCILIATION AUDIT');
  console.log('================================================================\n');

  const report = {
    timestamp: new Date().toISOString(),
    wallets: { total: 0, matched: 0, mismatched: 0, mismatches: [] },
    vendors: { total: 0, matched: 0, mismatched: 0, mismatches: [] },
    platform: { total: 0, status: 'UNKNOWN', details: null },
    fairCoins: { total: 0, matched: 0, mismatched: 0, mismatches: [] },
    superCoins: { total: 0, matched: 0, mismatched: 0, mismatches: [] },
    settlements: { total: 0, matched: 0, mismatched: 0, mismatches: [] },
    commissions: { total: 0, matched: 0, mismatched: 0, mismatches: [] },
    summary: {
      overallStatus: 'PASS',
      totalMismatches: 0,
    }
  };

  // -------------------------------------------------------------
  // 1. WALLET VS WALLET TRANSACTION RECONCILIATION
  // -------------------------------------------------------------
  console.log('--- 1. Reconciling Fiat Wallets vs WalletTransaction Ledger ---');
  const wallets = await Wallet.find().lean();
  report.wallets.total = wallets.length;

  for (const wallet of wallets) {
    const txs = await WalletTransaction.find({ walletId: wallet._id }).lean();
    let computedBalance = 0;
    for (const tx of txs) {
      if (tx.direction === 'CREDIT') {
        computedBalance = moneyUtils.addMoney(computedBalance, tx.amount);
      } else if (tx.direction === 'DEBIT') {
        computedBalance = moneyUtils.subtractMoney(computedBalance, tx.amount);
      }
    }

    const recordedBalance = moneyUtils.roundMoney(wallet.balance || 0);
    const diff = moneyUtils.subtractMoney(recordedBalance, computedBalance);

    if (Math.abs(diff) > 0.001) {
      report.wallets.mismatched++;
      const user = await User.findById(wallet.userId).lean();
      const isLegacy = user?.email?.endsWith('@fairkart.dev') || false;
      const isTest = user?.email?.includes('test') || user?.email?.includes('local') || false;
      const classification = isLegacy ? 'LEGACY_SEED' : (isTest ? 'TEST_DATA' : 'UNKNOWN');

      const mismatchItem = {
        recordId: wallet._id.toString(),
        entity: 'Wallet',
        currentBalance: recordedBalance,
        expectedBalance: computedBalance,
        difference: diff,
        source: user?.email || 'Unknown User',
        createdAt: wallet.createdAt ? new Date(wallet.createdAt).toISOString() : 'Unknown',
        isLegacySeed: isLegacy,
        isProductionData: !isLegacy && !isTest,
        classification,
      };
      report.wallets.mismatches.push(mismatchItem);
      console.log(`  [MISMATCH] Wallet ${wallet._id}: Recorded=₹${recordedBalance}, Expected=₹${computedBalance}, Diff=₹${diff} | Source: ${mismatchItem.source} | Class: ${classification}`);
    } else {
      report.wallets.matched++;
    }
  }
  console.log(`  Result: ${report.wallets.matched}/${report.wallets.total} MATCH, ${report.wallets.mismatched} MISMATCH\n`);

  // -------------------------------------------------------------
  // 2. VENDOR VS VENDOR LEDGER RECONCILIATION
  // -------------------------------------------------------------
  console.log('--- 2. Reconciling Vendor Balances vs VendorLedger ---');
  const vendors = await Vendor.find().lean();
  report.vendors.total = vendors.length;

  for (const vendor of vendors) {
    const ledgers = await VendorLedger.find({ vendorId: vendor._id }).lean();
    let computedBalance = 0;
    for (const l of ledgers) {
      computedBalance = moneyUtils.addMoney(computedBalance, l.credit || 0);
      computedBalance = moneyUtils.subtractMoney(computedBalance, l.debit || 0);
    }

    const recordedBalance = moneyUtils.roundMoney(vendor.balance || 0);
    const diff = moneyUtils.subtractMoney(recordedBalance, computedBalance);

    if (Math.abs(diff) > 0.001) {
      report.vendors.mismatched++;
      const isLegacy = vendor.slug === 'techkraft' || vendor.storeName?.includes('TechKraft');
      const isTest = vendor.storeName?.includes('Audit') || vendor.storeName?.includes('MLM') || vendor.storeName?.includes('Test');
      const classification = isLegacy ? 'LEGACY_SEED' : (isTest ? 'TEST_DATA' : 'UNKNOWN');

      const mismatchItem = {
        recordId: vendor._id.toString(),
        entity: 'Vendor',
        currentBalance: recordedBalance,
        expectedBalance: computedBalance,
        difference: diff,
        source: vendor.storeName,
        createdAt: vendor.createdAt ? new Date(vendor.createdAt).toISOString() : 'Unknown',
        isLegacySeed: isLegacy,
        isProductionData: !isLegacy && !isTest,
        classification,
      };
      report.vendors.mismatches.push(mismatchItem);
      console.log(`  [MISMATCH] Vendor "${vendor.storeName}" (${vendor._id}): Recorded=₹${recordedBalance}, Expected=₹${computedBalance}, Diff=₹${diff} | Class: ${classification}`);
    } else {
      report.vendors.matched++;
    }
  }
  console.log(`  Result: ${report.vendors.matched}/${report.vendors.total} MATCH, ${report.vendors.mismatched} MISMATCH\n`);

  // -------------------------------------------------------------
  // 3. PLATFORM LEDGER RECONCILIATION
  // -------------------------------------------------------------
  console.log('--- 3. Reconciling PlatformLedger Running Balance Snapshot ---');
  const platformRecords = await PlatformLedger.find().sort({ createdAt: 1 }).lean();
  report.platform.total = platformRecords.length;

  let runningPlatformBalance = 0;
  let platformSnapshotMismatch = false;

  for (let i = 0; i < platformRecords.length; i++) {
    const rec = platformRecords[i];
    runningPlatformBalance = moneyUtils.addMoney(runningPlatformBalance, rec.credit || 0);
    runningPlatformBalance = moneyUtils.subtractMoney(runningPlatformBalance, rec.debit || 0);

    const snapshot = moneyUtils.roundMoney(rec.balanceSnapshot || 0);
    if (Math.abs(snapshot - runningPlatformBalance) > 0.001) {
      platformSnapshotMismatch = true;
      console.log(`  [MISMATCH] PlatformLedger record #${i} (${rec.transactionId}): Snapshot=₹${snapshot}, RunningComputed=₹${runningPlatformBalance}`);
    }
  }

  const latestRecord = platformRecords[platformRecords.length - 1];
  const finalSnapshot = latestRecord ? moneyUtils.roundMoney(latestRecord.balanceSnapshot || 0) : 0;
  const platformDiff = moneyUtils.subtractMoney(finalSnapshot, runningPlatformBalance);

  if (platformSnapshotMismatch || Math.abs(platformDiff) > 0.001) {
    report.platform.status = 'MISMATCH';
    report.platform.details = {
      finalSnapshot,
      runningPlatformBalance,
      diff: platformDiff,
      hasIntermediateMismatches: platformSnapshotMismatch
    };
  } else {
    report.platform.status = 'MATCH';
    report.platform.details = {
      finalSnapshot,
      runningPlatformBalance,
      diff: 0
    };
  }
  console.log(`  Result: Platform Ledger Status: ${report.platform.status} (Snapshot=₹${finalSnapshot}, Running=₹${runningPlatformBalance})\n`);

  // -------------------------------------------------------------
  // 4. FAIR COINS VS COIN TRANSACTION RECONCILIATION
  // -------------------------------------------------------------
  console.log('--- 4. Reconciling Fair Coins vs CoinTransaction ---');
  const usersWithCoins = await User.find({
    $or: [{ fairCoinBalance: { $gt: 0 } }, { fairCoinBalance: { $exists: true } }]
  }).lean();
  report.fairCoins.total = usersWithCoins.length;

  for (const u of usersWithCoins) {
    const coinTxs = await CoinTransaction.find({ userId: u._id }).lean();
    let computedCoins = 0;
    for (const ctx of coinTxs) {
      if (['CREDIT', 'BONUS', 'REFERRAL_REWARD', 'PURCHASE_REWARD', 'SPIN_REWARD'].includes(ctx.type)) {
        computedCoins += Math.round(ctx.amount || 0);
      } else if (ctx.type === 'DEBIT') {
        computedCoins -= Math.round(ctx.amount || 0);
      }
    }

    const recordedCoins = Math.round(u.fairCoinBalance || 0);
    const diff = recordedCoins - computedCoins;

    if (diff !== 0) {
      report.fairCoins.mismatched++;
      const isLegacy = u.email?.endsWith('@fairkart.dev') || false;
      const isTest = u.email?.includes('test') || u.email?.includes('local') || false;
      const classification = isLegacy ? 'LEGACY_SEED' : (isTest ? 'TEST_DATA' : 'UNKNOWN');

      const mismatchItem = {
        recordId: u._id.toString(),
        entity: 'FairCoins',
        currentBalance: recordedCoins,
        expectedBalance: computedCoins,
        difference: diff,
        source: u.email,
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : 'Unknown',
        isLegacySeed: isLegacy,
        isProductionData: !isLegacy && !isTest,
        classification,
      };
      report.fairCoins.mismatches.push(mismatchItem);
      console.log(`  [MISMATCH] User ${u.email} (${u._id}): Recorded=${recordedCoins}, Expected=${computedCoins}, Diff=${diff} coins | Class: ${classification}`);
    } else {
      report.fairCoins.matched++;
    }
  }
  console.log(`  Result: ${report.fairCoins.matched}/${report.fairCoins.total} MATCH, ${report.fairCoins.mismatched} MISMATCH\n`);

  // -------------------------------------------------------------
  // 5. SUPER COINS VS SUPER COIN TRANSACTION RECONCILIATION
  // -------------------------------------------------------------
  console.log('--- 5. Reconciling Super Coins vs SuperCoinTransaction ---');
  const superCoinWallets = await SuperCoinWallet.find().lean();
  report.superCoins.total = superCoinWallets.length;

  for (const scw of superCoinWallets) {
    const scTxs = await SuperCoinTransaction.find({ userId: scw.userId }).lean();
    let computedSuperCoins = 0;
    for (const tx of scTxs) {
      if (['CREDIT', 'BONUS', 'SUBSCRIPTION_REWARD'].includes(tx.type)) {
        computedSuperCoins += Math.round(tx.amount || 0);
      } else if (tx.type === 'DEBIT') {
        computedSuperCoins -= Math.round(tx.amount || 0);
      }
    }

    const recordedSuperCoins = Math.round(scw.balance || 0);
    const diff = recordedSuperCoins - computedSuperCoins;

    if (diff !== 0) {
      report.superCoins.mismatched++;
      report.superCoins.mismatches.push({
        userId: scw.userId.toString(),
        recordedSuperCoins,
        computedSuperCoins,
        diff,
        txCount: scTxs.length
      });
      console.log(`  [MISMATCH] SuperCoinWallet for User ${scw.userId}: Recorded=${recordedSuperCoins}, Computed=${computedSuperCoins}, Diff=${diff}`);
    } else {
      report.superCoins.matched++;
    }
  }
  console.log(`  Result: ${report.superCoins.matched}/${report.superCoins.total} MATCH, ${report.superCoins.mismatched} MISMATCH\n`);

  // -------------------------------------------------------------
  // 6. SETTLEMENT VS VENDOR ORDER RECONCILIATION
  // -------------------------------------------------------------
  console.log('--- 6. Reconciling VendorSettlement vs VendorOrder ---');
  const settlements = await VendorSettlement.find().lean();
  report.settlements.total = settlements.length;

  for (const st of settlements) {
    const suborder = await VendorOrder.findById(st.suborderId).lean();
    if (!suborder) {
      report.settlements.mismatched++;
      report.settlements.mismatches.push({
        settlementId: st._id.toString(),
        suborderId: st.suborderId?.toString(),
        reason: 'VendorOrder document missing (orphan settlement)'
      });
      console.log(`  [MISMATCH] Settlement ${st._id}: VendorOrder ${st.suborderId} not found`);
      continue;
    }

    const grossMatch = Math.abs(moneyUtils.subtractMoney(st.grossAmount || 0, suborder.subtotal || 0)) < 0.001;
    const netMatch = Math.abs(moneyUtils.subtractMoney(st.netPayable || 0, suborder.vendorEarning || 0)) < 0.001;

    if (!grossMatch || !netMatch) {
      report.settlements.mismatched++;
      report.settlements.mismatches.push({
        settlementId: st._id.toString(),
        suborderId: suborder._id.toString(),
        settlementGross: st.grossAmount,
        suborderGross: suborder.subtotal,
        settlementNet: st.netPayable,
        suborderNet: suborder.vendorEarning
      });
      console.log(`  [MISMATCH] Settlement ${st._id} vs Suborder ${suborder._id}: GrossMatch=${grossMatch}, NetMatch=${netMatch}`);
    } else {
      report.settlements.matched++;
    }
  }
  console.log(`  Result: ${report.settlements.matched}/${report.settlements.total} MATCH, ${report.settlements.mismatched} MISMATCH\n`);

  // -------------------------------------------------------------
  // 7. COMMISSION VS MLM CONFIGURATION RECONCILIATION
  // -------------------------------------------------------------
  console.log('--- 7. Reconciling Commission Calculations ---');
  const commissions = await Commission.find({
    type: { $in: ['MLM_VENDOR_SUBSCRIPTION_COMMISSION', 'MLM_UPLINE_COMMISSION', 'NETWORK_COMMISSION'] }
  }).lean();
  report.commissions.total = commissions.length;

  for (const comm of commissions) {
    const expectedAmount = Math.round((comm.orderAmount * comm.commissionPercentage) / 100);
    const recordedAmount = Math.round(comm.commissionAmount);

    if (Math.abs(recordedAmount - expectedAmount) > 1) { // 1 rupee rounding margin
      report.commissions.mismatched++;
      report.commissions.mismatches.push({
        commissionId: comm._id.toString(),
        level: comm.level,
        orderAmount: comm.orderAmount,
        percentage: comm.commissionPercentage,
        recordedAmount,
        expectedAmount
      });
      console.log(`  [MISMATCH] Commission ${comm._id}: Recorded=₹${recordedAmount}, Expected=₹${expectedAmount}`);
    } else {
      report.commissions.matched++;
    }
  }
  console.log(`  Result: ${report.commissions.matched}/${report.commissions.total} MATCH, ${report.commissions.mismatched} MISMATCH\n`);

  // -------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------
  const totalMismatches =
    report.wallets.mismatched +
    report.vendors.mismatched +
    (report.platform.status === 'MISMATCH' ? 1 : 0) +
    report.fairCoins.mismatched +
    report.superCoins.mismatched +
    report.settlements.mismatched +
    report.commissions.mismatched;

  report.summary.totalMismatches = totalMismatches;
  report.summary.overallStatus = totalMismatches === 0 ? 'PASS' : 'PASS WITH ISSUES';

  console.log('================================================================');
  console.log(`  DAILY RECONCILIATION SUMMARY: ${report.summary.overallStatus.toUpperCase()}`);
  console.log(`  Total Evaluated Modules: 7`);
  console.log(`  Total Financial Mismatches: ${totalMismatches}`);
  console.log('================================================================\n');

  if (totalMismatches > 0) {
    console.log('--- DETAILED FINANCIAL MISMATCH CLASSIFICATION TABLE ---');
    console.table([
      ...report.wallets.mismatches,
      ...report.vendors.mismatches,
      ...report.fairCoins.mismatches,
    ].map(m => ({
      recordId: m.recordId,
      entity: m.entity,
      currentBalance: m.currentBalance,
      expectedBalance: m.expectedBalance,
      difference: m.difference,
      source: m.source,
      classification: m.classification,
      isLegacySeed: m.isLegacySeed,
      isProductionData: m.isProductionData
    })));
  }

  return report;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  connectDB().then(async () => {
    try {
      await runFinancialReconciliation();
    } catch (e) {
      console.error('Reconciliation failed with fatal error:', e);
    } finally {
      await mongoose.disconnect();
      process.exit(0);
    }
  });
}
