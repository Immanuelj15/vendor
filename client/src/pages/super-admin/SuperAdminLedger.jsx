import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Building,
  Store,
  RefreshCw,
  Search,
  Filter,
  CreditCard,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Wallet
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export const SuperAdminLedger = () => {
  const [loading, setLoading] = useState(true);
  const [platformLogs, setPlatformLogs] = useState([]);
  const [vendorLogs, setVendorLogs] = useState([]);
  const [ledgerStats, setLedgerStats] = useState([]);
  const [platformBalance, setPlatformBalance] = useState(0);
  const [activeTab, setActiveTab] = useState('PLATFORM'); // 'PLATFORM' or 'VENDOR'
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');

  const loadLedger = async (type = typeFilter) => {
    try {
      setLoading(true);
      setErrorMsg('');
      const params = { page, limit: 30 };
      if (type) params.type = type;
      const res = await superAdminService.getFinancialLedger(params);
      if (res) {
        setPlatformLogs(res.platformLogs || []);
        setVendorLogs(res.vendorLedgerRecent || []);
        setLedgerStats(res.ledgerStats || []);
        setPlatformBalance(res.platformBalance || 0);
      }
    } catch (err) {
      console.error('Failed to load ledger records:', err);
      setErrorMsg('Failed to load double-entry financial ledger records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger(typeFilter);
  }, [typeFilter, page]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm"
      >
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-600 uppercase tracking-wider mb-1">
            <Receipt className="w-4 h-4" /> Double-Entry Accounting
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial Ledger Audit</h1>
          <p className="text-xs text-slate-500">
            Immutable transaction records for marketplace orders, MLM subscription splits, and vendor disbursements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadLedger(typeFilter)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* Summary KPI Balance Cards */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -3, transition: { duration: 0.18 } }}
          className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white p-6 rounded-3xl shadow-lg shadow-blue-500/20"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-100">
              Platform Retained Balance
            </span>
            <Wallet className="w-4 h-4 text-blue-200" />
          </div>
          <p className="text-2xl font-black font-mono mt-2">
            ₹{platformBalance.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-blue-100/90 mt-1">Snapshot after all fees & payouts</p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          whileHover={{ y: -3, transition: { duration: 0.18 } }}
          className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Order Commissions (5%)</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 font-mono">
            ₹
            {(
              ledgerStats.find((s) => s._id === 'ORDER_COMMISSION')?.totalCredit || 0
            ).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {ledgerStats.find((s) => s._id === 'ORDER_COMMISSION')?.count || 0} checkout transactions
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          whileHover={{ y: -3, transition: { duration: 0.18 } }}
          className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Vendor Subscriptions</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 font-mono">
            ₹
            {(
              ledgerStats.find((s) => s._id === 'VENDOR_SUBSCRIPTION')?.totalCredit || 0
            ).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Gross subscription fee intake</p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          whileHover={{ y: -3, transition: { duration: 0.18 } }}
          className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Total Payouts Settled</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-rose-600 font-mono">
            ₹
            {(
              ledgerStats.find((s) => s._id === 'WITHDRAWAL')?.totalDebit || 0
            ).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Vendor withdrawals paid out</p>
        </motion.div>
      </motion.div>

      {/* Tabs & Type Filters */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('PLATFORM')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'PLATFORM'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            Platform Ledger ({platformLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('VENDOR')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'VENDOR'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            Vendor Ledgers ({vendorLogs.length})
          </button>
        </div>

        {activeTab === 'PLATFORM' && (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600"
            >
              <option value="">All Platform Types</option>
              <option value="ORDER_COMMISSION">ORDER_COMMISSION</option>
              <option value="VENDOR_SUBSCRIPTION">VENDOR_SUBSCRIPTION</option>
              <option value="WITHDRAWAL">WITHDRAWAL</option>
              <option value="CUSTOMER_SUBSCRIPTION">CUSTOMER_SUBSCRIPTION</option>
            </select>
          </div>
        )}
      </motion.div>

      {/* Ledger Records Table */}
      <motion.div
        variants={itemVariants}
        className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm"
      >
        <div className="overflow-x-auto">
          {activeTab === 'PLATFORM' ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-5">Tx ID</th>
                  <th className="py-3.5 px-5">Transaction Type</th>
                  <th className="py-3.5 px-5">Description</th>
                  <th className="py-3.5 px-5 text-right">Credit (+)</th>
                  <th className="py-3.5 px-5 text-right">Debit (-)</th>
                  <th className="py-3.5 px-5 text-right">Balance Snapshot</th>
                  <th className="py-3.5 px-5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {platformLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400 font-medium">
                      No platform ledger records found.
                    </td>
                  </tr>
                ) : (
                  platformLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-blue-50/40 transition font-mono">
                      <td className="py-3.5 px-5 text-[11px] text-slate-500">
                        {log.transactionId || log._id}
                      </td>
                      <td className="py-3.5 px-5 font-sans font-semibold">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] rounded-full font-bold ${
                            log.type === 'ORDER_COMMISSION'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.type === 'VENDOR_SUBSCRIPTION'
                              ? 'bg-blue-100 text-blue-800'
                              : log.type === 'WITHDRAWAL'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {log.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-sans text-slate-700 max-w-xs truncate font-medium">
                        {log.description}
                      </td>
                      <td className="py-3.5 px-5 text-right font-black text-emerald-600">
                        {log.credit > 0 ? `+₹${log.credit.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="py-3.5 px-5 text-right font-black text-rose-600">
                        {log.debit > 0 ? `-₹${log.debit.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="py-3.5 px-5 text-right font-black text-slate-900">
                        ₹{(log.balanceSnapshot || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 font-sans text-[11px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-5">Vendor Store</th>
                  <th className="py-3.5 px-5">Type</th>
                  <th className="py-3.5 px-5">Description</th>
                  <th className="py-3.5 px-5 text-right">Credit (+)</th>
                  <th className="py-3.5 px-5 text-right">Debit (-)</th>
                  <th className="py-3.5 px-5 text-right">Balance Snapshot</th>
                  <th className="py-3.5 px-5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendorLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400 font-medium">
                      No vendor ledger records found.
                    </td>
                  </tr>
                ) : (
                  vendorLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-blue-50/40 transition font-mono">
                      <td className="py-3.5 px-5 font-sans font-bold text-slate-900">
                        {log.vendorId?.storeName || 'Vendor'}
                      </td>
                      <td className="py-3.5 px-5 font-sans">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                            log.transactionType === 'SALE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.transactionType === 'PAYOUT'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {log.transactionType}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-sans text-slate-700 max-w-xs truncate font-medium">
                        {log.description}
                      </td>
                      <td className="py-3.5 px-5 text-right font-black text-emerald-600">
                        {log.credit > 0 ? `+₹${log.credit.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="py-3.5 px-5 text-right font-black text-rose-600">
                        {log.debit > 0 ? `-₹${log.debit.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="py-3.5 px-5 text-right font-black text-blue-600">
                        ₹{(log.balanceSnapshot || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 font-sans text-[11px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SuperAdminLedger;
