import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Calendar, Loader2, Download, TrendingUp, DollarSign, Award, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const AdminAnalytics = () => {
  const [range, setRange] = useState('30days');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);

  // Analytics datasets
  const [revenueData, setRevenueData] = useState({});
  const [ordersData, setOrdersData] = useState({ counts: {}, trend: [] });
  const [customerData, setCustomerData] = useState({});
  const [vendorData, setVendorData] = useState({});
  const [shopData, setShopData] = useState({});
  const [commissionData, setCommissionData] = useState({ breakdown: {} });
  const [fulfillmentData, setFulfillmentData] = useState({});
  const [deliveryData, setDeliveryData] = useState({});
  const [fairCoinData, setFairCoinData] = useState({});

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const queryParams = { range };
      if (range === 'custom') {
        if (!from || !to) return;
        queryParams.from = from;
        queryParams.to = to;
      }

      const paramsStr = new URLSearchParams(queryParams).toString();

      const [
        revRes,
        ordRes,
        custRes,
        vendRes,
        shopRes,
        commRes,
        fulRes,
        delRes,
        coinRes,
      ] = await Promise.all([
        api.get(`/admin/analytics/revenue?${paramsStr}`),
        api.get(`/admin/analytics/orders?${paramsStr}`),
        api.get(`/admin/analytics/customers?${paramsStr}`),
        api.get(`/admin/analytics/vendors?${paramsStr}`),
        api.get(`/admin/analytics/shops?${paramsStr}`),
        api.get(`/admin/analytics/commissions?${paramsStr}`),
        api.get(`/admin/analytics/fulfillments?${paramsStr}`),
        api.get(`/admin/analytics/deliveries?${paramsStr}`),
        api.get(`/admin/analytics/fair-coins?${paramsStr}`),
      ]);

      setRevenueData(revRes.data.data || {});
      setOrdersData(ordRes.data.data || { counts: {}, trend: [] });
      setCustomerData(custRes.data.data || {});
      setVendorData(vendRes.data.data || {});
      setShopData(shopRes.data.data || {});
      setCommissionData(commRes.data.data || { breakdown: {} });
      setFulfillmentData(fulRes.data.data || {});
      setDeliveryData(delRes.data.data || {});
      setFairCoinData(coinRes.data.data || {});
    } catch (e) {
      console.error('Failed to load analytics', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    fetchAnalytics();
  };

  const downloadCsv = async (reportType) => {
    try {
      const response = await api.get(`/admin/exports/${reportType}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Failed to download CSV export');
    }
  };

  const commissionBreakdownData = Object.entries(commissionData?.breakdown || {}).map(([key, val]) => ({
    name: key.replace(/_/g, ' ').toUpperCase(),
    value: val,
  }));

  const fulfillmentStatusData = Object.entries(fulfillmentData || {})
    .filter(([key]) => key !== 'success')
    .map(([key, val]) => ({
      name: key.toUpperCase(),
      count: val,
    }));

  if (loading && Object.keys(revenueData).length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Aggregating platform metrics...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-8"
    >
      {/* Header and Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 sm:p-7 rounded-3xl shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Calendar className="w-5 h-5" />
            </div>
            <span>Platform Analytics & Reporting</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Filter operational data, monitor sales growth, and inspect 9-level commissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="bg-white text-xs sm:text-sm text-slate-800 font-bold border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-600 shadow-xs"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="custom">Custom Range</option>
          </select>

          {range === 'custom' && (
            <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 text-xs">
              <input
                type="date"
                required
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="bg-white border border-slate-200 text-slate-800 font-medium rounded-xl px-3 py-2 shadow-xs"
              />
              <span className="text-slate-500 font-bold">to</span>
              <input
                type="date"
                required
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="bg-white border border-slate-200 text-slate-800 font-medium rounded-xl px-3 py-2 shadow-xs"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl shadow-xs transition-all"
              >
                Apply
              </button>
            </form>
          )}
        </div>
      </div>

      {/* CSV Export Quick Links */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs space-y-3.5">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Download Platform CSV Reports
        </h3>
        <div className="flex flex-wrap gap-2.5">
          {['orders', 'payments', 'commissions', 'settlements', 'users'].map((item) => (
            <button
              key={item}
              onClick={() => downloadCsv(item)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-700 border border-slate-200 rounded-xl transition-all shadow-xs"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span className="capitalize">{item} Dataset CSV</span>
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue vs Orders trend */}
        <div className="bg-white border border-slate-200/80 p-6 sm:p-7 rounded-3xl shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Sales Revenue & Orders Volume Trend</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ordersData.trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="_id" stroke="#64748b" fontSize={11} />
                <YAxis yAxisId="left" stroke="#64748b" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue (₹)"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="count"
                  name="Orders Count"
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Commission Distribution */}
        <div className="bg-white border border-slate-200/80 p-6 sm:p-7 rounded-3xl shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Commission Allocation Breakdown</span>
          </h3>
          <div className="h-64 flex flex-col md:flex-row items-center justify-between gap-4">
            {commissionBreakdownData.length === 0 ? (
              <div className="text-xs text-slate-400 py-10 w-full text-center">
                No commission records found in this range.
              </div>
            ) : (
              <>
                <div className="w-full md:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={commissionBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {commissionBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 space-y-2 max-h-full overflow-y-auto pr-2">
                  {commissionBreakdownData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="text-slate-700 font-semibold">{item.name}</span>
                      </div>
                      <span className="text-slate-900 font-bold">₹{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chart 3: Fulfillment Statuses */}
        <div className="bg-white border border-slate-200/80 p-6 sm:p-7 rounded-3xl shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            <span>Fulfillment Status Distribution</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fulfillmentStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="count" name="Packages" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Fair Coin flow */}
        <div className="bg-white border border-slate-200/80 p-6 sm:p-7 rounded-3xl shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600" />
            <span>Fair Coin Issued vs Redeemed</span>
          </h3>
          <div className="h-64 flex flex-col justify-center space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl text-center">
                <div className="text-xs text-amber-800 font-bold uppercase tracking-wider">Coins Issued</div>
                <div className="text-2xl font-black text-amber-700 mt-1">
                  {(fairCoinData.coinsIssued || 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl text-center">
                <div className="text-xs text-blue-800 font-bold uppercase tracking-wider">Coins Redeemed</div>
                <div className="text-2xl font-black text-blue-700 mt-1">
                  {(fairCoinData.coinsRedeemed || 0).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">From Referral System</span>
                <span className="text-slate-900 font-bold">
                  {(fairCoinData.coinsFromReferrals || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">From Spin Wheel Rewards</span>
                <span className="text-slate-900 font-bold">
                  {(fairCoinData.coinsFromSpin || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Admin Adjustments Credit</span>
                <span className="text-slate-900 font-bold">
                  {(fairCoinData.adminCredits || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminAnalytics;
