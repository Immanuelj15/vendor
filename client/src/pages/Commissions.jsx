import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Percent, TrendingUp, DollarSign, Calendar, RefreshCw, ArrowLeft, ArrowRight, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const Commissions = () => {
  const [commissions, setCommissions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const loadCommissions = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/users/me/commissions?page=${page}&limit=10&status=${statusFilter}`);
      if (res.data?.success) {
        setCommissions(res.data.data.list || []);
        setTotal(res.data.data.total || 0);
        setPages(res.data.data.pages || 1);
      }
    } catch (err) {
      console.error('Failed to load commissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCommissions();
  }, [page, statusFilter]);

  const handleFilterChange = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  // Calculate stats
  const totalAmount = commissions.reduce((sum, item) => {
    if (item.status === 'PAID') return sum + item.commissionAmount;
    return sum;
  }, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between min-h-[500px]"
      >
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <Percent className="w-5 h-5" />
                  </div>
                  <span>My Commissions</span>
                </h1>
                <p className="text-sm text-slate-600 mt-1">Track your affiliate network earnings and bonuses</p>
              </div>
            </div>

            {/* Stats Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Page Earnings</p>
                  <h3 className="text-2xl font-black text-slate-900">₹{(totalAmount / 100).toFixed(2)}</h3>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Records</p>
                  <h3 className="text-2xl font-black text-slate-900">{total} Transactions</h3>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <button
                onClick={() => handleFilterChange('')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === ''
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleFilterChange('PAID')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'PAID'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Paid
              </button>
              <button
                onClick={() => handleFilterChange('CANCELLED')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'CANCELLED'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Reversed
              </button>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-12 bg-slate-100 rounded-xl"></div>
                <div className="h-12 bg-slate-100 rounded-xl"></div>
                <div className="h-12 bg-slate-100 rounded-xl"></div>
              </div>
            ) : commissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Percent className="w-12 h-12 stroke-[1.5] mb-3 text-slate-300" />
                <p className="text-base font-bold text-slate-700">No commission records found</p>
                <p className="text-xs text-slate-500 mt-1">Commissions will appear here when your direct network places orders.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200/80 rounded-2xl bg-white shadow-xs">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-xs tracking-wider">
                      <th className="p-4">Reference Order</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {commissions.map((item) => (
                      <tr key={item._id} className="hover:bg-blue-50/30 text-slate-700 transition-colors">
                        <td className="p-4 font-bold">
                          {item.orderId ? (
                            <Link
                              to={`/account/orders/${item.orderId._id}`}
                              className="flex items-center gap-1.5 text-blue-600 hover:underline"
                            >
                              <ShoppingBag className="w-4 h-4" />
                              <span>#{item.orderId.orderNumber}</span>
                            </Link>
                          ) : (
                            <span className="text-slate-400">Direct Bonus</span>
                          )}
                        </td>
                        <td className="p-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                          </span>
                        </td>
                        <td className="p-4 font-semibold uppercase tracking-wider text-xs text-slate-600">
                          {item.type?.replace(/_/g, ' ')}
                        </td>
                        <td className="p-4 font-black text-slate-900 text-base">
                          ₹{(item.commissionAmount / 100).toFixed(2)}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                              item.status === 'PAID'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : item.status === 'PENDING'
                                ? 'bg-amber-50 border-amber-200 text-amber-700'
                                : 'bg-rose-50 border-rose-200 text-rose-700'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-8 text-sm">
              <span className="text-xs text-slate-500 font-semibold">
                Page {page} of {pages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 disabled:opacity-50 text-slate-700 transition-colors shadow-xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page === pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 disabled:opacity-50 text-slate-700 transition-colors shadow-xs"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
    </div>
  );
};

export default Commissions;
