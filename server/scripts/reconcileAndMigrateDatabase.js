import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Vendor } from '../src/models/Vendor.js';
import { Wallet } from '../src/models/Wallet.js';
import { WalletTransaction } from '../src/models/WalletTransaction.js';
import { WebhookEvent } from '../src/models/WebhookEvent.js';
import { Commission } from '../src/models/Commission.js';
import { Order } from '../src/models/Order.js';
import { VendorOrder } from '../src/models/VendorOrder.js';
import { Product } from '../src/models/Product.js';
import { CoinTransaction } from '../src/models/CoinTransaction.js';
import { VendorLedger } from '../src/models/VendorLedger.js';
import { PlatformLedger } from '../src/models/PlatformLedger.js';
import { VendorWithdrawal } from '../src/models/VendorWithdrawal.js';
import { AuditLog } from '../src/models/AuditLog.js';

async function reconcileAndMigrate() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('Connected to MongoDB. Starting database migration & reconciliation...\n');

    // 1. Synchronize all Schema Indexes
    console.log('1. SYNCHRONIZING MONGOOSE INDEXES...');
    const models = [
      User, Vendor, Product, Order, VendorOrder,
      Wallet, WalletTransaction, WebhookEvent, Commission,
      CoinTransaction, VendorLedger, PlatformLedger, VendorWithdrawal, AuditLog
    ];
    for (const model of models) {
      await model.syncIndexes();
      console.log(`   ✓ Synced indexes for model: ${model.modelName}`);
    }

    // 2. Backfill WalletTransaction for Historical MLM Commissions
    console.log('\n2. BACKFILLING WALLET TRANSACTIONS FOR HISTORICAL COMMISSIONS...');
    const commissions = await Commission.find({ status: 'PAID' });
    let createdTxCount = 0;

    for (const comm of commissions) {
      const existingTx = await WalletTransaction.findOne({
        userId: comm.recipientUserId,
        referenceId: (comm.subscriptionId || comm.orderId || comm._id).toString(),
        type: 'COMMISSION_CREDIT',
      });

      if (!existingTx) {
        const wallet = await Wallet.findOne({ userId: comm.recipientUserId });
        if (wallet) {
          await WalletTransaction.create({
            walletId: wallet._id,
            userId: comm.recipientUserId,
            type: 'COMMISSION_CREDIT',
            direction: 'CREDIT',
            amount: comm.commissionAmount,
            currency: 'INR',
            balanceBefore: Math.max(0, wallet.balance - comm.commissionAmount),
            balanceAfter: wallet.balance,
            referenceId: (comm.subscriptionId || comm.orderId || comm._id).toString(),
            referenceType: comm.type,
            description: `Historical commission credit: ${comm.type} (Level ${comm.level || 1})`,
            createdAt: comm.createdAt || new Date(),
          });
          createdTxCount++;
        }
      }
    }
    console.log(`   ✓ Created ${createdTxCount} missing WalletTransaction ledger records.`);

    // 3. Reconcile Fiat Wallets
    console.log('\n3. RECONCILING FIAT WALLETS (Wallet vs WalletTransaction)...');
    const wallets = await Wallet.find();
    let walletMatches = 0;
    let walletMismatches = 0;

    for (const w of wallets) {
      const credits = await WalletTransaction.aggregate([
        { $match: { walletId: w._id, direction: 'CREDIT' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const debits = await WalletTransaction.aggregate([
        { $match: { walletId: w._id, direction: 'DEBIT' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const totalCredits = credits[0]?.total || 0;
      const totalDebits = debits[0]?.total || 0;
      const calculatedBalance = totalCredits - totalDebits;

      if (Math.abs(w.balance - calculatedBalance) < 0.01) {
        walletMatches++;
      } else {
        walletMismatches++;
        console.warn(`   ⚠️ Wallet Mismatch for user ${w.userId}: stored=${w.balance}, calculated=${calculatedBalance}`);
      }
    }
    console.log(`   ✓ Total Wallets Checked: ${wallets.length}`);
    console.log(`   ✓ Matched: ${walletMatches}, Mismatches: ${walletMismatches}`);

    // 4. Reconcile Fair Coins (User.fairCoinBalance vs CoinTransaction)
    console.log('\n4. RECONCILING FAIR COINS (User vs CoinTransaction)...');
    const users = await User.find();
    let coinMatches = 0;
    let coinMismatches = 0;

    for (const u of users) {
      const coinCredits = await CoinTransaction.aggregate([
        { $match: { userId: u._id, type: { $ne: 'DEBIT' } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const coinDebits = await CoinTransaction.aggregate([
        { $match: { userId: u._id, type: 'DEBIT' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const totalCredits = coinCredits[0]?.total || 0;
      const totalDebits = coinDebits[0]?.total || 0;
      const expectedCoins = totalCredits - totalDebits;

      if (Math.abs((u.fairCoinBalance || 0) - expectedCoins) < 0.01) {
        coinMatches++;
      } else {
        coinMismatches++;
        console.warn(`   ⚠️ Coin Mismatch for user ${u.email}: stored=${u.fairCoinBalance}, calculated=${expectedCoins}`);
      }
    }
    console.log(`   ✓ Total Users Checked: ${users.length}`);
    console.log(`   ✓ Matched: ${coinMatches}, Mismatches: ${coinMismatches}`);

    // 5. Vendor Ledgers & Balance Verification
    console.log('\n5. RECONCILING VENDOR LEDGERS...');
    const vendors = await Vendor.find();
    for (const v of vendors) {
      const latestLedger = await VendorLedger.findOne({ vendorId: v._id }).sort({ createdAt: -1 });
      console.log(`   ✓ Vendor "${v.storeName}": Available=₹${v.balance}, Pending=₹${v.pendingBalance || 0}, Latest Ledger BalanceSnapshot=₹${latestLedger?.balanceSnapshot ?? 'None'}`);
    }

    // 6. Platform Ledger Verification
    console.log('\n6. RECONCILING PLATFORM LEDGER...');
    const latestPlatform = await PlatformLedger.findOne().sort({ createdAt: -1 });
    console.log(`   ✓ Platform Ledger Entries: ${await PlatformLedger.countDocuments()}, Current Snapshot Balance: ₹${latestPlatform?.balanceSnapshot || 0}`);

    console.log('\n==================================================');
    console.log('       MIGRATION & RECONCILIATION COMPLETE        ');
    console.log('==================================================');

    await mongoose.disconnect();
  } catch (err) {
    console.error('Migration execution failed:', err);
  }
}

reconcileAndMigrate();
