import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  ShoppingBag,
  RefreshCw,
  Calendar,
  CreditCard,
  DollarSign
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { superAdminService } from '../../services/superAdminService';

const ROLE_COLORS = {
  SUPER_ADMIN: '#2563eb',
  ADMIN: '#4f46e5',
  VENDOR: '#059669',
  USER: '#0284c7',
  SHOPKEEPER: '#0891b2',
  DELIVERY_PARTNER: '#db2777',
  HUB_STAFF: '#7c3aed',
};

const DEFAULT_COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2', '#db2777'];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export const SuperAdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await superAdminService.getAnalytics();
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-semibold text-slate-700">Aggregating platform database telemetry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 text-rose-700 rounded-3xl max-w-xl mx-auto my-12 text-center text-xs shadow-sm">
        <p className="font-bold mb-2 text-sm">Error Loading Analytics</p>
        <p className="text-slate-600 mb-4">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="px-5 py-2.5 bg-rose-600 text-white rounded-xl font-bold shadow-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  const {
    registrationsByMonth = [],
    roleDistribution = [],
    orderStatusDistribution = [],
    revenueByMonth = [],
  } = data || {};

  const roleChartData = roleDistribution.map((item) => ({
    name: item._id || 'UNKNOWN',
    value: item.count,
    color: ROLE_COLORS[item._id] || '#64748b',
  }));

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
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm"
      >
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-600 uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" /> Telemetry & Insights
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Intelligence & Analytics</h1>
          <p className="text-xs text-slate-500">
            Historical registration velocities, role concentrations, order processing, and payment receipts.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </motion.div>

      {/* Grid: 2 Charts Top */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Registrations Trend */}
        <motion.div
          variants={itemVariants}
          className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" /> User Registration Velocity
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">New user onboarding volume by month</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {registrationsByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={registrationsByMonth}>
                  <defs>
                    <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="_id" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#userGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                No monthly historical user registration data available.
              </div>
            )}
          </div>
        </motion.div>

        {/* Role Distribution Donut */}
        <motion.div
          variants={itemVariants}
          className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-indigo-600" /> Platform Role Distribution
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Active account categorization</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {roleChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {roleChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-xs">No role distribution data available.</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Grid: 2 Charts Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <motion.div
          variants={itemVariants}
          className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" /> Monthly Paid Platform Volume
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Gross settled revenue over time</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {revenueByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueByMonth}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="_id" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    formatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                No historical payment data recorded yet.
              </div>
            )}
          </div>
        </motion.div>

        {/* Order Status Breakdown */}
        <motion.div
          variants={itemVariants}
          className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-600" /> Order Fulfillment Statuses
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Volume distribution across order lifecycle</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {orderStatusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderStatusDistribution}>
                  <XAxis dataKey="_id" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                No orders recorded yet.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SuperAdminAnalytics;
