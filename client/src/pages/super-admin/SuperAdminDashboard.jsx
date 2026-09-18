import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  ShieldCheck,
  Store,
  ShoppingBag,
  CreditCard,
  Coins,
  AlertOctagon,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Sliders,
  FileText,
  UserPlus,
  Sparkles,
  TrendingUp,
  Shield,
  Activity
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export const SuperAdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await superAdminService.getDashboardStats();
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load Super Admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <RefreshCw className="w-9 h-9 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading Super Admin control center...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-rose-700 max-w-xl mx-auto my-12 text-center shadow-sm">
        <AlertOctagon className="w-12 h-12 mx-auto mb-3 text-rose-500" />
        <h3 className="font-bold text-lg mb-1">Access or Loading Error</h3>
        <p className="text-xs mb-4 text-rose-600">{error}</p>
        <button
          onClick={fetchStats}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { metrics, roleDistribution, recentAuditLogs } = data || {};

  const cards = [
    {
      title: 'Total Users',
      value: (metrics?.totalUsers || 0).toLocaleString(),
      sub: `${metrics?.activeUsers || 0} active • ${metrics?.inactiveUsers || 0} inactive`,
      icon: Users,
      color: 'from-blue-600 to-indigo-600',
      bgLight: 'bg-blue-50 text-blue-700',
      link: '/super-admin/users',
    },
    {
      title: 'System Admins',
      value: (metrics?.totalAdmins || 0).toLocaleString(),
      sub: 'Platform operations & master control',
      icon: ShieldCheck,
      color: 'from-blue-700 to-cyan-600',
      bgLight: 'bg-indigo-50 text-indigo-700',
      link: '/super-admin/admins',
    },
    {
      title: 'Active Vendors',
      value: (metrics?.totalVendors || 0).toLocaleString(),
      sub: 'Verified marketplace merchants',
      icon: Store,
      color: 'from-emerald-600 to-teal-600',
      bgLight: 'bg-emerald-50 text-emerald-700',
      link: '/admin/vendors',
    },
    {
      title: 'Catalog Products',
      value: (metrics?.totalProducts || 0).toLocaleString(),
      sub: 'Approved catalog items',
      icon: ShoppingBag,
      color: 'from-indigo-600 to-violet-600',
      bgLight: 'bg-violet-50 text-violet-700',
      link: '/admin/products',
    },
    {
      title: 'Total Orders',
      value: (metrics?.totalOrders || 0).toLocaleString(),
      sub: 'Fulfilled & in-flight orders',
      icon: CreditCard,
      color: 'from-sky-600 to-blue-600',
      bgLight: 'bg-sky-50 text-sky-700',
      link: '/admin/orders',
    },
    {
      title: 'Completed Revenue',
      value: `₹${(metrics?.totalRevenue || 0).toLocaleString('en-IN')}`,
      sub: 'Total completed transactions',
      icon: TrendingUp,
      color: 'from-blue-600 to-emerald-600',
      bgLight: 'bg-blue-50 text-blue-700',
      link: '/super-admin/analytics',
    },
    {
      title: 'Fair Coins Circulating',
      value: (metrics?.totalFairCoins || 0).toLocaleString('en-IN'),
      sub: 'Rewards held in user wallets',
      icon: Coins,
      color: 'from-amber-500 to-orange-500',
      bgLight: 'bg-amber-50 text-amber-700',
      link: '/super-admin/settings',
    },
    {
      title: 'System Health',
      value: metrics?.isMaintenanceMode ? 'Maintenance' : 'Nominal',
      sub: 'Database & API cluster active',
      icon: Activity,
      color: metrics?.isMaintenanceMode ? 'from-rose-600 to-red-600' : 'from-emerald-600 to-teal-600',
      bgLight: metrics?.isMaintenanceMode ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700',
      link: '/super-admin/settings',
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Header & Status Banner */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Super Admin Dashboard</h1>
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                metrics?.isMaintenanceMode
                  ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
                  : 'bg-emerald-100/80 text-emerald-800 border border-emerald-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${metrics?.isMaintenanceMode ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              {metrics?.isMaintenanceMode ? 'Maintenance Active' : 'Cluster Live & Nominal'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Supreme platform authority, real-time ledger accounting, and 9-level MLM monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/super-admin/admins"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200/60 transition shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Admin</span>
          </Link>
          <Link
            to="/super-admin/settings"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition border border-slate-200 shadow-sm"
          >
            <Sliders className="w-4 h-4 text-slate-500" />
            <span>Settings</span>
          </Link>
          <button
            onClick={fetchStats}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 transition border border-slate-200 shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* KPI Cards Grid with Framer Motion hover elevation */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.title}
              variants={itemVariants}
              whileHover={{ y: -3, transition: { duration: 0.18 } }}
            >
              <Link
                to={c.link}
                className="group p-5 bg-white hover:bg-slate-50/50 border border-slate-200/80 hover:border-blue-300 rounded-2xl transition-all shadow-sm hover:shadow-md flex flex-col justify-between h-full"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500">{c.title}</span>
                  <div className={`p-2 rounded-xl bg-gradient-to-tr ${c.color} text-white shadow-md shadow-blue-500/10`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900 tracking-tight font-mono">{c.value}</p>
                  <div className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between border-t border-slate-100 pt-2">
                    <span className="truncate">{c.sub}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Two Column Section: Role Distribution & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Distribution */}
        <motion.div
          variants={itemVariants}
          className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              Role Distribution
            </h3>
            <Link to="/super-admin/roles" className="text-xs text-blue-600 font-bold hover:underline">
              Matrix
            </Link>
          </div>
          <div className="space-y-2.5">
            {roleDistribution &&
              Object.entries(roleDistribution).map(([roleName, count]) => (
                <div
                  key={roleName}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 hover:border-blue-200 transition"
                >
                  <span className="text-xs font-bold text-slate-700">{roleName}</span>
                  <span className="text-xs font-mono font-black text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </motion.div>

        {/* Recent Audit Activity Stream */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-blue-50 text-blue-600">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Recent Audit Trail
              </h3>
            </div>
            <Link to="/super-admin/audit-logs" className="text-xs text-blue-600 font-bold hover:underline">
              View All Logs
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentAuditLogs && recentAuditLogs.length > 0 ? (
              recentAuditLogs.map((log) => (
                <div
                  key={log._id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60 hover:border-blue-200 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-md font-mono">
                        {log.action}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 truncate">
                        by {log.userId?.name || 'Super Admin'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Entity: <span className="font-semibold text-slate-700">{log.entity}</span> {log.entityId ? `#${log.entityId}` : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No recent audit events recorded.</p>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SuperAdminDashboard;
