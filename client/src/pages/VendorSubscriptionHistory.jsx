import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Loader2, History } from 'lucide-react';

export const VendorSubscriptionHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vendor-subscriptions/history');
      setHistory(res.data.data.history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <History className="w-6 h-6 text-slate-700" />
        <h1 className="text-2xl font-bold">Subscription History</h1>
      </div>

      <div className="bg-white rounded-2xl shadow border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Date</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Plan</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Cycle</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Amount</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Validity</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {history.map(sub => (
              <tr key={sub._id} className="hover:bg-slate-50">
                <td className="p-4 text-sm text-slate-600 font-medium">
                  {new Date(sub.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <span className="font-bold text-slate-800">{sub.planId?.name || 'N/A'}</span>
                </td>
                <td className="p-4 text-sm text-slate-600">{sub.billingCycle}</td>
                <td className="p-4 font-bold text-slate-800">₹{sub.amount}</td>
                <td className="p-4 text-xs text-slate-500">
                  {new Date(sub.startDate).toLocaleDateString()} - <br/>
                  {new Date(sub.endDate).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                    sub.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' :
                    sub.status === 'EXPIRED' ? 'bg-rose-50 text-rose-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {sub.status}
                  </span>
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-500">No subscription history found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
