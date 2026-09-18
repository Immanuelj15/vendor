import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Loader2, Search, Filter } from 'lucide-react';

export const AdminVendorSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    billingCycle: ''
  });

  useEffect(() => {
    fetchSubscriptions();
  }, [filters]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        ...filters
      }).toString();
      const res = await api.get(`/admin/subscriptions?${query}`);
      setSubscriptions(res.data.data.subscriptions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Vendor Subscriptions</h1>
      
      <div className="flex gap-4 mb-6 bg-white p-4 rounded-xl shadow border">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-bold text-slate-600">Filters:</span>
        </div>
        <select name="status" value={filters.status} onChange={handleFilterChange} className="border rounded p-2 text-sm bg-slate-50">
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
          <option value="EXPIRED">Expired</option>
        </select>
        <select name="billingCycle" value={filters.billingCycle} onChange={handleFilterChange} className="border rounded p-2 text-sm bg-slate-50">
          <option value="">All Billing Cycles</option>
          <option value="MONTHLY">Monthly</option>
          <option value="YEARLY">Yearly</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Vendor</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Plan</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Billing Cycle</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Start Date</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Expiry Date</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {subscriptions.map(sub => (
                <tr key={sub._id} className="hover:bg-slate-50">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{sub.entityId?.storeName || 'Unknown Vendor'}</div>
                    <div className="text-xs text-slate-500">{sub.entityId?.email}</div>
                  </td>
                  <td className="p-4 font-semibold text-sm">{sub.planId?.name}</td>
                  <td className="p-4 text-sm">{sub.billingCycle}</td>
                  <td className="p-4 text-sm">{new Date(sub.startDate).toLocaleDateString()}</td>
                  <td className="p-4 text-sm font-semibold">{new Date(sub.endDate).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      sub.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' :
                      sub.status === 'EXPIRED' ? 'bg-rose-50 text-rose-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                </tr>
              ))}
              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">No subscriptions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
