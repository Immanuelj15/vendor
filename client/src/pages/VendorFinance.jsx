import React, { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Clock, FileText, Download } from 'lucide-react';
import { motion } from 'framer-motion';

export const VendorFinance = () => {
  const [activeTab, setActiveTab] = useState('statement');
  const [statement, setStatement] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Fetch Statement
      const stmtRes = await fetch('/api/vendor/finance/statement', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const stmtData = await stmtRes.json();
      if (stmtRes.ok) setStatement(stmtData.data);

      // Fetch Settlements
      const stlRes = await fetch('/api/vendor/finance/settlements', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const stlData = await stlRes.json();
      if (stlRes.ok) setSettlements(stlData.data.settlements || []);
    } catch (err) {
      console.error('Failed to fetch finance data', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-500 font-medium animate-pulse">
        Loading merchant financial data...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Financial Dashboard</h1>
        <p className="text-sm text-slate-600 mt-1">
          Track sales earnings, platform commissions, and 7-day verified settlements
        </p>
      </div>

      {/* Summary Cards */}
      {statement && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sales</p>
            </div>
            <h3 className="text-2xl font-black text-slate-900">₹{statement.sales?.toLocaleString()}</h3>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                <ArrowDownRight className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Commissions</p>
            </div>
            <h3 className="text-2xl font-black text-slate-900">₹{statement.commission?.toLocaleString()}</h3>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payouts Paid</p>
            </div>
            <h3 className="text-2xl font-black text-slate-900">₹{statement.payouts?.toLocaleString()}</h3>
          </div>

          <div className="bg-white border-2 border-blue-600/30 p-5 rounded-2xl shadow-xs relative overflow-hidden bg-gradient-to-br from-blue-50/50 to-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
                <IndianRupee className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Available Balance</p>
            </div>
            <h3 className="text-3xl font-black text-blue-600">₹{statement.closingBalance?.toLocaleString()}</h3>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="flex border-b border-slate-100 bg-slate-50/60">
          <button
            onClick={() => setActiveTab('statement')}
            className={`flex-1 py-4 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'statement'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Account Ledger</span>
          </button>
          <button
            onClick={() => setActiveTab('settlements')}
            className={`flex-1 py-4 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'settlements'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>7-Day Settlements</span>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'statement' && statement && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-slate-900">Recent Transactions</h2>
                <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all">
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3.5 font-bold">Date</th>
                      <th className="px-4 py-3.5 font-bold">Type</th>
                      <th className="px-4 py-3.5 font-bold">Description</th>
                      <th className="px-4 py-3.5 font-bold text-right">Amount</th>
                      <th className="px-4 py-3.5 font-bold text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {!statement.transactions || statement.transactions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-10 text-center text-slate-400">
                          No transactions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      statement.transactions.map((tx, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-4 py-3.5 text-slate-600">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {tx.transactionType}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-800 font-medium">{tx.description}</td>
                          <td
                            className={`px-4 py-3.5 text-right font-black ${
                              tx.credit > 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {tx.credit > 0 ? '+' : '-'}₹{tx.credit > 0 ? tx.credit : tx.debit}
                          </td>
                          <td className="px-4 py-3.5 text-right font-black text-slate-900">
                            ₹{tx.balanceSnapshot}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settlements' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-sm flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>7-Day Settlement Policy:</strong> Customer payments are held securely by the platform for 7
                  days after the order is completed to account for customer returns and quality disputes. After 7 days, the
                  eligible amount is automatically transferred to your available payout balance.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3.5 font-bold">Order Ref</th>
                      <th className="px-4 py-3.5 font-bold text-right">Order Amount</th>
                      <th className="px-4 py-3.5 font-bold text-right">Commission</th>
                      <th className="px-4 py-3.5 font-bold text-right">Settlement Amt</th>
                      <th className="px-4 py-3.5 font-bold">Eligibility Date</th>
                      <th className="px-4 py-3.5 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {settlements.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-10 text-center text-slate-400">
                          No pending settlements found.
                        </td>
                      </tr>
                    ) : (
                      settlements.map((s, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-4 py-3.5 font-mono text-blue-600 font-bold">
                            {s.suborderId?.subOrderNumber || 'N/A'}
                          </td>
                          <td className="px-4 py-3.5 text-right text-slate-700 font-medium">₹{s.orderAmount}</td>
                          <td className="px-4 py-3.5 text-right text-rose-600 font-medium">-₹{s.commissionDeducted}</td>
                          <td className="px-4 py-3.5 text-right font-black text-emerald-600">
                            ₹{s.settlementAmount}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">
                            {new Date(s.eligibilityDate).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                                s.status === 'SETTLED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : s.status === 'HOLD'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default VendorFinance;
