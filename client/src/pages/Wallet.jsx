import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Coins, Clock } from 'lucide-react';

export const Wallet = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const [walletRes, txRes] = await Promise.all([
        api.get('/fair-coins/wallet'),
        api.get('/fair-coins/transactions'),
      ]);
      setWallet(walletRes.data.data.wallet);
      setTransactions(txRes.data.data.transactions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Coins className="w-6 h-6 text-amber-500" />
          <span>Fair Coins Wallet & Rewards</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">Manage your loyalty rewards, referral earnings, and checkout balance.</p>
      </div>

      {/* Wallet Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-6 rounded-3xl shadow-md shadow-blue-500/20 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-100 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-300" />
            <span>Fair Coins Balance</span>
          </div>
          <div className="text-4xl font-black">{Number(wallet?.balance ?? 0).toLocaleString()}</div>
          <p className="text-[11px] font-semibold text-blue-100/90">Equivalent to ₹{((wallet?.balance || 0) * 0.1).toFixed(2)} at Checkout</p>
        </div>

        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm space-y-2">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Earned</div>
          <div className="text-3xl font-black text-blue-600">+{Number(wallet?.totalEarned ?? 0).toLocaleString()} Coins</div>
          <p className="text-[11px] text-slate-500">From purchases, referrals & daily spins</p>
        </div>

        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm space-y-2">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Redeemed</div>
          <div className="text-3xl font-black text-slate-800">-{Number(wallet?.totalSpent ?? 0).toLocaleString()} Coins</div>
          <p className="text-[11px] text-slate-500">Redeemed for instant order discounts</p>
        </div>
      </div>

      {/* Immutable Ledger History Table */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>Immutable Fair Coins Ledger</span>
          </h3>
          <span className="text-xs text-slate-500">Audited Transaction History</span>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400">No ledger transactions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="pb-3">Transaction</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Balance After</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3.5 font-semibold text-slate-900">
                      <div>{tx.description || tx.source}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Ref: {tx.referenceId || tx._id}</div>
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.amount > 0 ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className={`py-3.5 font-black ${tx.amount > 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                    </td>
                    <td className="py-3.5 font-bold text-slate-900">{tx.balanceAfter}</td>
                    <td className="py-3.5 text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
