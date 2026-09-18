import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  ShieldCheck, 
  Users, 
  Store, 
  ShoppingBag, 
  Coins, 
  DollarSign, 
  Settings as SettingsIcon, 
  Clock, 
  Loader2, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  FileCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Settings State Form
  const [mlmForm, setMlmForm] = useState({ level1: 10, level2: 5, level3: 2 });
  const [coinForm, setCoinForm] = useState({ regCoins: 100, refCoins: 50 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [metricsRes, alertsRes, settingsRes] = await Promise.all([
        api.get('/admin/metrics'),
        api.get('/admin/alerts').catch(() => ({ data: { data: { alerts: [] } } })),
        api.get('/admin/settings').catch(() => ({ data: { data: { settings: [] } } }))
      ]);

      setMetrics(metricsRes.data.data.metrics);
      setAlerts(alertsRes.data.data.alerts || []);
      
      const rawSettings = settingsRes.data.data.settings || [];
      setSettings(rawSettings);

      const mlmConfig = rawSettings.find(s => s.key === 'MLM_CONFIG');
      if (mlmConfig && mlmConfig.value?.levels) {
        setMlmForm({
          level1: mlmConfig.value.levels[0]?.percentage || 10,
          level2: mlmConfig.value.levels[1]?.percentage || 5,
          level3: mlmConfig.value.levels[2]?.percentage || 2,
        });
      }

      const coinConfig = rawSettings.find(s => s.key === 'FAIR_COIN_RULES');
      if (coinConfig && coinConfig.value) {
        setCoinForm({
          regCoins: coinConfig.value.registrationCoins || 100,
          refCoins: coinConfig.value.referralCoins || 50,
        });
      }
    } catch (e) {
      console.error('Error fetching dashboard metrics', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMLM = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/admin/settings', {
        key: 'MLM_CONFIG',
        category: 'MLM',
        value: {
          maxLevels: 3,
          levels: [
            { level: 1, percentage: Number(mlmForm.level1), name: 'Level 1 (Direct)' },
            { level: 2, percentage: Number(mlmForm.level2), name: 'Level 2' },
            { level: 3, percentage: Number(mlmForm.level3), name: 'Level 3' },
          ],
        },
      });
      alert('MLM settings saved!');
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCoins = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/admin/settings', {
        key: 'FAIR_COIN_RULES',
        category: 'REWARDS',
        value: {
          registrationCoins: Number(coinForm.regCoins),
          referralCoins: Number(coinForm.refCoins),
        },
      });
      alert('Coin settings saved!');
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update coin rules');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Loading operations metrics...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Title block */}
      <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-800 p-6 md:p-8 rounded-3xl text-white shadow-xl shadow-blue-700/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white flex items-center justify-center font-bold shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-100 text-[10px] font-black uppercase tracking-wider mb-1 border border-blue-400/20">
              Operations Center
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">FairKart Admin Operations</h1>
            <p className="text-xs text-blue-100 mt-0.5">Track live platform transactions, vendor approvals & customer operational items</p>
          </div>
        </div>
      </div>

      {/* Operational Alerts */}
      {alerts.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200/80 p-6 rounded-3xl space-y-3 shadow-xs">
          <h3 className="font-bold text-sm text-amber-950 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Active Operational Action Items ({alerts.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((a, idx) => (
              <div key={idx} className="bg-white border border-amber-200 p-3.5 rounded-2xl flex items-start gap-3 shadow-xs">
                <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${
                  a.type === 'CRITICAL' ? 'text-rose-500' : a.type === 'WARNING' ? 'text-amber-500' : 'text-blue-500'
                }`} />
                <div>
                  <div className="text-xs font-bold text-slate-800">{a.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{a.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div whileHover={{ y: -2 }} className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-slate-500 font-bold">Total Gross Sales</div>
            <div className="text-2xl font-black text-slate-900 mt-1">₹{(metrics?.totalRevenue || 0).toLocaleString()}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <DollarSign className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-slate-500 font-bold">Orders Processed</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{(metrics?.totalOrders || 0).toLocaleString()}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <TrendingUp className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-slate-500 font-bold">Active Customers</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{(metrics?.totalUsers || 0).toLocaleString()}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Users className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-slate-500 font-bold">Registered Vendors</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{(metrics?.totalShops || 0).toLocaleString()}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Store className="w-6 h-6" />
          </div>
        </motion.div>
      </div>

      {/* Settings Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MLM Settings */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-4 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-blue-600" />
              <span>Operational Commission Configuration</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Define multi-tier upline distribution percentages</p>
          </div>

          <form onSubmit={handleSaveMLM} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-700 font-bold mb-1.5">Level 1 Direct Referral Commission (%)</label>
              <input
                type="number"
                value={mlmForm.level1}
                onChange={(e) => setMlmForm({ ...mlmForm, level1: e.target.value })}
                className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-700 font-bold mb-1.5">Level 2 Secondary Referral Commission (%)</label>
              <input
                type="number"
                value={mlmForm.level2}
                onChange={(e) => setMlmForm({ ...mlmForm, level2: e.target.value })}
                className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-700 font-bold mb-1.5">Level 3 Tertiary Referral Commission (%)</label>
              <input
                type="number"
                value={mlmForm.level3}
                onChange={(e) => setMlmForm({ ...mlmForm, level3: e.target.value })}
                className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
            >
              {saving ? 'Updating...' : 'Save Commission Rules'}
            </button>
          </form>
        </div>

        {/* Fair Coin settings */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-4 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              <span>Fair Coins Issuance Rates</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Set baseline welcome bonuses and customer referral rewards</p>
          </div>

          <form onSubmit={handleSaveCoins} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-700 font-bold mb-1.5">Registration Welcome Reward (Coins)</label>
              <input
                type="number"
                value={coinForm.regCoins}
                onChange={(e) => setCoinForm({ ...coinForm, regCoins: e.target.value })}
                className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-700 font-bold mb-1.5">Referral Success Reward (Coins)</label>
              <input
                type="number"
                value={coinForm.refCoins}
                onChange={(e) => setCoinForm({ ...coinForm, refCoins: e.target.value })}
                className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
            >
              {saving ? 'Saving...' : 'Save Coin Allocation Rules'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
