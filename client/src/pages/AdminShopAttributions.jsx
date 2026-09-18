import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Store, User, Calendar, ShieldCheck, Filter, Search, Loader2, AlertCircle, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

export const AdminShopAttributions = () => {
  const [attributions, setAttributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter States
  const [shopId, setShopId] = useState('');
  const [customerUserId, setCustomerUserId] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchAttributions();
  }, [page, shopId, customerUserId, date, status]);

  const fetchAttributions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 10,
        ...(shopId && { shopId }),
        ...(customerUserId && { customerUserId }),
        ...(date && { date }),
        ...(status && { status }),
      };
      
      const res = await api.get('/admin/shop-attributions', { params });
      setAttributions(res.data.data.attributions || []);
      setTotalPages(res.data.data.pagination.pages || 1);
      setTotalItems(res.data.data.pagination.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch attributions');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setShopId('');
    setCustomerUserId('');
    setDate('');
    setStatus('');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-brand-400" />
            <span>Customer Shop Attributions</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Audit log of customer-to-shop permanent mappings.</p>
        </div>
        <button
          onClick={fetchAttributions}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors self-start sm:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Filters Card */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-slate-200 font-bold text-xs">
          <Filter className="w-4 h-4 text-brand-400" />
          <span>Filter Logs</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Shop ID</label>
            <input
              type="text"
              placeholder="e.g. 660f..."
              value={shopId}
              onChange={(e) => { setShopId(e.target.value); setPage(1); }}
              className="w-full bg-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Customer User ID</label>
            <input
              type="text"
              placeholder="e.g. 660e..."
              value={customerUserId}
              onChange={(e) => { setCustomerUserId(e.target.value); setPage(1); }}
              className="w-full bg-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Attribution Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setPage(1); }}
              className="w-full bg-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full bg-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-brand-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        {(shopId || customerUserId || date || status) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={handleResetFilters}
              className="text-xs text-brand-400 hover:text-brand-350 font-bold transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Attributions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2.5">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            <span className="text-slate-400 text-xs">Loading logs...</span>
          </div>
        ) : attributions.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-xs">
            No attribution records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400 font-extrabold tracking-wider bg-slate-950/40">
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Attributed Shop</th>
                  <th className="py-3.5 px-6">Method</th>
                  <th className="py-3.5 px-6">QR Code token</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                {attributions.map((att) => (
                  <tr key={att._id} className="hover:bg-slate-850/40 transition-colors">
                    {/* Customer */}
                    <td className="py-4 px-6">
                      {att.customerUserId ? (
                        <div className="space-y-0.5">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-brand-400" />
                            <span>{att.customerUserId.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{att.customerUserId.email}</div>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono">Deleted User</span>
                      )}
                    </td>
                    
                    {/* Shop */}
                    <td className="py-4 px-6">
                      {att.shopId ? (
                        <div className="space-y-0.5">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <Store className="w-3.5 h-3.5 text-brand-400" />
                            <span>{att.shopId.shopName}</span>
                          </div>
                          <div className="text-[10px] text-brand-400 font-mono font-bold">{att.shopId.shopCode}</div>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono">Deleted Shop</span>
                      )}
                    </td>
                    
                    {/* Channel */}
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-bold tracking-wide border border-slate-700">
                        {att.attributedVia}
                      </span>
                    </td>
                    
                    {/* Token */}
                    <td className="py-4 px-6 font-mono text-[10px] text-slate-400">
                      {att.qrCodeId ? att.qrCodeId.publicToken.substring(0, 12) + '...' : 'N/A'}
                    </td>
                    
                    {/* Date */}
                    <td className="py-4 px-6 text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{new Date(att.attributedAt).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase ${
                        att.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {att.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-slate-950/40 px-6 py-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Showing log page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalItems} total attributions)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
