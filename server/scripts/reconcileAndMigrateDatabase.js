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
import { moneyUtils } from '../src/utils/moneyUtils.js';

async function reconcileAndMigrate() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('Connected to MongoDB. Starting database baseline migration & reconciliation...\n');

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

    // 2. Baseline Migration for Confirmed Legacy Fiat Wallets
    console.log('\n2. BASELINE MIGRATING CONFIRMED LEGACY WALLETS...');
    const wallets = await Wallet.find();
    let migratedWallets = 0;

    for (const w of wallets) {
      const txs = await WalletTransaction.find({ walletId: w._id }).lean();
      let computed = 0;
      for (const t of txs) {
        if (t.direction === 'CREDIT') computed = moneyUtils.addMoney(computed, t.amount);
        else if (t.direction === 'DEBIT') computed = moneyUtils.subtractMoney(computed, t.amount);
      }
      const recorded = moneyUtils.roundMoney(w.balance || 0);
      const diff = moneyUtils.subtractMoney(recorded, computed);

      if (diff > 0.001) {
        const user = await User.findById(w.userId);
        console.log(`   Migrating baseline for Wallet ${w._id} (User: ${user?.email || w.userId}): Diff = ₹${diff}`);
        await WalletTransaction.create({
          walletId: w._id,
          userId: w.userId,
          type: 'ADJUSTMENT',
          direction: 'CREDIT',
          amount: diff,
          currency: 'INR',
          balanceBefore: computed,
          balanceAfter: recorded,
          referenceId: w._id.toString(),
          referenceType: 'LEGACY_BASELINE',
          description: 'Legacy balance baseline migration',
          createdAt: new Date(),
        });
        migratedWallets++;
      }
    }
    console.log(`   ✓ Migrated ${migratedWallets} legacy wallet baseline records.`);

    // 3. Baseline Migration for Confirmed Legacy & Test Vendors
    console.log('\n3. BASELINE MIGRATING CONFIRMED VENDOR LEDGERS...');
    const vendors = await Vendor.find();
    let migratedVendors = 0;

    for (const v of vendors) {
      const ledgers = await VendorLedger.find({ vendorId: v._id }).lean();
      let computed = 0;
      for (const l of ledgers) {
        computed = moneyUtils.addMoney(computed, l.credit || 0);
        computed = moneyUtils.subtractMoney(computed, l.debit || 0);
      }
      const recorded = moneyUtils.roundMoney(v.balance || 0);
      const diff = moneyUtils.subtractMoney(recorded, computed);

      if (Math.abs(diff) > 0.001) {
        console.log(`   Migrating baseline for Vendor "${v.storeName}" (${v._id}): Recorded=₹${recorded}, Computed=₹${computed}, Diff=₹${diff}`);
        await VendorLedger.create({
          vendorId: v._id,
          transactionType: 'ADJUSTMENT',
          credit: diff > 0 ? diff : Math.abs(diff),
          debit: 0,
          balanceSnapshot: recorded,
          referenceId: v._id.toString(),
          description: 'Legacy balance baseline migration',
          createdAt: new Date(),
        });
        migratedVendors++;
      }
    }
    console.log(`   ✓ Migrated ${migratedVendors} vendor ledger baseline records.`);

    // 4. Baseline Migration for Confirmed Legacy Fair Coins
    console.log('\n4. BASELINE MIGRATING CONFIRMED FAIR COIN BALANCES...');
    const users = await User.find({
      $or: [{ fairCoinBalance: { $gt: 0 } }, { fairCoinBalance: { $exists: true } }]
    });
    let migratedCoins = 0;

    for (const u of users) {
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

      if (diff > 0) {
        console.log(`   Migrating baseline for User ${u.email} (${u._id}): Diff = ${diff} coins`);
        await CoinTransaction.create({
          userId: u._id,
          type: 'CREDIT',
          amount: diff,
          balanceBefore: computedCoins,
          balanceAfter: recordedCoins,
          source: 'LEGACY_SEED',
          referenceId: u._id.toString(),
          description: 'Legacy balance baseline migration',
          createdAt: new Date(),
        });
        migratedCoins++;
      }
    }
    console.log(`   ✓ Migrated ${migratedCoins} user Fair Coin baseline records.`);

    console.log('\n==================================================');
    console.log('       BASELINE MIGRATION & RECONCILIATION COMPLETE ');
    console.log('==================================================');

    await mongoose.disconnect();
  } catch (err) {
    console.error('Migration execution failed:', err);
  }
}

reconcileAndMigrate();
