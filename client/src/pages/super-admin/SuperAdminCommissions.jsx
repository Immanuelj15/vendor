import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Percent,
  Save,
  RotateCcw,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  DollarSign,
  Layers,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

const DEFAULT_LEVELS = [
  { level: 1, percentage: 10, name: 'Level 1 (Direct Sponsor)' },
  { level: 2, percentage: 5, name: 'Level 2' },
  { level: 3, percentage: 3, name: 'Level 3' },
  { level: 4, percentage: 2, name: 'Level 4' },
  { level: 5, percentage: 1, name: 'Level 5' },
  { level: 6, percentage: 1, name: 'Level 6' },
  { level: 7, percentage: 1, name: 'Level 7' },
  { level: 8, percentage: 1, name: 'Level 8' },
  { level: 9, percentage: 1, name: 'Level 9' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export const SuperAdminCommissions = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Rules state
  const [platformCommission, setPlatformCommission] = useState(5);
  const [levels, setLevels] = useState(DEFAULT_LEVELS);

  // Simulation Calculator state
  const [simAmount, setSimAmount] = useState(1000);
  const [simType, setSimType] = useState('ORDER'); // 'ORDER' or 'SUBSCRIPTION'

  const loadSettings = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await superAdminService.getCommissionSettings();
      if (res) {
        if (res.platformCommissionPercent !== undefined) {
          setPlatformCommission(res.platformCommissionPercent);
        }
        if (res.mlmConfig?.levels && Array.isArray(res.mlmConfig.levels)) {
          setLevels(res.mlmConfig.levels);
        }
      }
    } catch (err) {
      console.error('Failed to fetch commission settings:', err);
      setErrorMsg('Failed to load existing commission settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const totalMLMPercentage = levels.reduce((acc, curr) => acc + (Number(curr.percentage) || 0), 0);
  const vendorPayoutPercentage = Math.max(0, 100 - platformCommission);

  const handleLevelPercentageChange = (index, value) => {
    const nextLevels = [...levels];
    nextLevels[index] = {
      ...nextLevels[index],
      percentage: Number(value) || 0,
    };
    setLevels(nextLevels);
  };

  const handleLevelNameChange = (index, value) => {
    const nextLevels = [...levels];
    nextLevels[index] = {
      ...nextLevels[index],
      name: value,
    };
    setLevels(nextLevels);
  };

  const resetToDefault = () => {
    setPlatformCommission(5);
    setLevels(DEFAULT_LEVELS);
    setSuccessMsg('Reset to standard platform rules (5% marketplace fee, 9-level MLM preset)');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleSave = async () => {
    if (totalMLMPercentage > 100) {
      setErrorMsg(`Total MLM percentage cannot exceed 100%. Current sum is ${totalMLMPercentage}%.`);
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');
      await superAdminService.updateCommissionSettings({
        platformCommissionPercent: platformCommission,
        levels,
      });
      setSuccessMsg('Commission rules updated and persisted to financial engine successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to update commission settings:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to save commission rules');
    } finally {
      setSaving(false);
    }
  };

  // Calculator simulations
  const platformFee = Math.round((simAmount * platformCommission) / 100);
  const vendorEarning = simAmount - platformFee;

  let totalSimMLMDistributed = 0;
  const mlmBreakdown = levels.map((l) => {
    const amt = Math.round((simAmount * (l.percentage || 0)) / 100);
    totalSimMLMDistributed += amt;
    return {
      ...l,
      amount: amt,
    };
  });
  const netPlatformRetained = simAmount - totalSimMLMDistributed;

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
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm"
      >
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-600 uppercase tracking-wider mb-1">
            <Percent className="w-4 h-4" /> Financial Rules
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Commission & Revenue Rules</h1>
          <p className="text-xs text-slate-500">
            Define platform marketplace fee splits and 9-level MLM subscription distribution matrices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={resetToDefault}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Restore Defaults</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving || totalMLMPercentage > 100}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </motion.div>

      {successMsg && (
        <motion.div
          variants={itemVariants}
          className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-2xl flex items-center gap-2 shadow-sm"
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span className="font-semibold">{successMsg}</span>
        </motion.div>
      )}

      {errorMsg && (
        <motion.div
          variants={itemVariants}
          className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2 shadow-sm"
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span className="font-semibold">{errorMsg}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Rules Setup (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Marketplace Split Card */}
          <motion.div
            variants={itemVariants}
            className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm"
          >
            <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              E-Commerce Marketplace Split Rule
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Configures the platform commission deduction applied on checkout orders.
            </p>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/70 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900">Platform Commission</span>
                  <p className="text-[11px] text-slate-500">Credited to Platform Ledger on completed orders</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={platformCommission}
                    onChange={(e) => setPlatformCommission(Number(e.target.value))}
                    className="w-20 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-sm text-right font-bold focus:outline-none focus:border-blue-600 shadow-sm"
                  />
                  <span className="text-blue-600 font-extrabold text-sm">%</span>
                </div>
              </div>

              {/* Visual Split Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-blue-600">Platform: {platformCommission}%</span>
                  <span className="text-emerald-600">Vendor Net: {vendorPayoutPercentage}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
                  <div
                    style={{ width: `${Math.min(100, Math.max(0, platformCommission))}%` }}
                    className="bg-blue-600 h-full transition-all duration-300"
                  />
                  <div
                    style={{ width: `${Math.min(100, Math.max(0, vendorPayoutPercentage))}%` }}
                    className="bg-emerald-500 h-full transition-all duration-300"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* 9-Level MLM Matrix Card */}
          <motion.div
            variants={itemVariants}
            className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  9-Level MLM Referral Commission Matrix
                </h2>
                <p className="text-xs text-slate-500">
                  Percentage distributed to uplines when a vendor subscribes to a plan.
                </p>
              </div>

              {/* Total indicator */}
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Allocated</span>
                <span
                  className={`text-sm font-mono font-black ${
                    totalMLMPercentage <= 100 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {totalMLMPercentage}% / 100%
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              {levels.map((lvl, index) => (
                <div
                  key={lvl.level}
                  className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-center justify-between gap-4 hover:border-blue-300 hover:bg-blue-50/20 transition"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center justify-center">
                      L{lvl.level}
                    </span>
                    <input
                      type="text"
                      value={lvl.name}
                      onChange={(e) => handleLevelNameChange(index, e.target.value)}
                      className="bg-transparent border-none text-xs text-slate-800 font-bold focus:outline-none flex-1 truncate"
                    />
                  </div>

                  <div className="flex items-center gap-2.5">
                    <input
                      type="range"
                      min="0"
                      max="30"
                      step="0.5"
                      value={lvl.percentage}
                      onChange={(e) => handleLevelPercentageChange(index, e.target.value)}
                      className="w-24 accent-blue-600 hidden sm:block cursor-pointer"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={lvl.percentage}
                        onChange={(e) => handleLevelPercentageChange(index, e.target.value)}
                        className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-xs text-right focus:outline-none focus:border-blue-600 shadow-sm"
                      />
                      <span className="text-slate-500 text-xs font-bold">%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Live Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <motion.div
            variants={itemVariants}
            className="bg-white border border-blue-200 rounded-3xl p-6 shadow-md sticky top-6 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Live Engine Simulator</h3>
                  <p className="text-[11px] text-slate-500">Validate formula math instantly</p>
                </div>
              </div>

              {/* Simulation Mode Toggle */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                <button
                  onClick={() => setSimType('ORDER')}
                  className={`px-3 py-1 rounded-lg transition ${
                    simType === 'ORDER' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Order
                </button>
                <button
                  onClick={() => setSimType('SUBSCRIPTION')}
                  className={`px-3 py-1 rounded-lg transition ${
                    simType === 'SUBSCRIPTION' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  MLM Sub
                </button>
              </div>
            </div>

            {/* Simulated Amount Input */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 mb-4">
              <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">
                {simType === 'ORDER' ? 'Order Gross Amount (₹)' : 'Vendor Subscription Fee (₹)'}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-blue-600">₹</span>
                <input
                  type="number"
                  min="1"
                  step="100"
                  value={simAmount}
                  onChange={(e) => setSimAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-transparent border-none text-2xl font-black font-mono text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {simType === 'ORDER' ? (
              /* Order simulation math */
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-blue-900">Platform Ledger Commission</span>
                    <p className="text-[10px] text-blue-600 font-mono">5% of ₹{simAmount.toLocaleString('en-IN')}</p>
                  </div>
                  <span className="text-lg font-black text-blue-700 font-mono">
                    ₹{platformFee.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-emerald-900">Vendor Ledger Net Payout</span>
                    <p className="text-[10px] text-emerald-600 font-mono">95% of ₹{simAmount.toLocaleString('en-IN')}</p>
                  </div>
                  <span className="text-lg font-black text-emerald-700 font-mono">
                    ₹{vendorEarning.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>
                    When customer pays ₹{simAmount.toLocaleString('en-IN')}, platform retains ₹{platformFee.toLocaleString('en-IN')}, and vendor receives ₹{vendorEarning.toLocaleString('en-IN')} into available balance.
                  </span>
                </div>
              </div>
            ) : (
              /* Subscription MLM Simulation Math */
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-semibold">Total 9-Level MLM Distribution:</span>
                  <span className="font-black text-blue-700 font-mono">
                    ₹{totalSimMLMDistributed.toLocaleString('en-IN')} ({totalMLMPercentage}%)
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 flex justify-between items-center text-xs">
                  <span className="text-emerald-900 font-bold">Net Retained Platform Revenue:</span>
                  <span className="font-black text-emerald-700 font-mono">
                    ₹{netPlatformRetained.toLocaleString('en-IN')} ({100 - totalMLMPercentage}%)
                  </span>
                </div>

                {/* Level by level breakdown */}
                <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {mlmBreakdown.map((item) => (
                    <div
                      key={item.level}
                      className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60 flex justify-between items-center"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                          L{item.level}
                        </span>
                        <span className="text-slate-700 font-medium truncate text-[11px]">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        ₹{item.amount.toLocaleString('en-IN')} ({item.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default SuperAdminCommissions;
