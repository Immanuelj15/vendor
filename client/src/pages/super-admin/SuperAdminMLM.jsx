import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Network,
  Search,
  Users,
  Award,
  Coins,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  DollarSign,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export const SuperAdminMLM = () => {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [networkData, setNetworkData] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [activeTab, setActiveTab] = useState('tree'); // 'tree' or 'commissions'
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [error, setError] = useState('');

  const loadNetwork = async (search = '') => {
    try {
      setLoading(true);
      setError('');
      const params = search ? { search } : {};
      const res = await superAdminService.getMLMTree(params);
      if (res?.treeData) {
        setNetworkData(res);
      }
    } catch (err) {
      console.error('Failed to load MLM tree:', err);
      setError(err.response?.data?.message || 'Failed to load referral tree');
    } finally {
      setLoading(false);
    }
  };

  const loadCommissions = async () => {
    try {
      const res = await superAdminService.getMLMCommissions({ limit: 20 });
      if (res?.commissions) {
        setCommissions(res.commissions);
      }
    } catch (err) {
      console.error('Failed to load commissions:', err);
    }
  };

  useEffect(() => {
    loadNetwork();
    loadCommissions();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      loadNetwork(searchQuery.trim());
    }
  };

  const resetSearch = () => {
    setSearchQuery('');
    loadNetwork();
  };

  const rootUser = networkData?.targetUser || networkData?.treeData?.user;
  const rankInfo = networkData?.treeData?.rankInfo;
  const stats = networkData?.treeData?.stats;
  const tree = networkData?.treeData?.tree || {};

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
            <Network className="w-4 h-4" /> 9-Level MLM Engine
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Referral Network Visualizer</h1>
          <p className="text-xs text-slate-500">
            Inspect downline hierarchies, leadership ranks, and multi-tier commission distributions up to 9 levels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { loadNetwork(searchQuery); loadCommissions(); }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.form
        variants={itemVariants}
        onSubmit={handleSearch}
        className="bg-white border border-slate-200/80 p-2.5 rounded-2xl flex items-center gap-3 shadow-sm"
      >
        <Search className="w-4 h-4 text-blue-600 ml-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search network root by email, referral code, or User ID..."
          className="bg-transparent border-none text-xs text-slate-900 placeholder-slate-400 focus:outline-none flex-1 font-medium"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={resetSearch}
            className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 font-semibold"
          >
            Clear
          </button>
        )}
        <button
          type="submit"
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition"
        >
          Inspect Tree
        </button>
      </motion.form>

      {error && (
        <motion.div
          variants={itemVariants}
          className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2 shadow-sm"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span className="font-semibold">{error}</span>
        </motion.div>
      )}

      {/* Root User Details Card */}
      {rootUser && (
        <motion.div
          variants={itemVariants}
          className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-400" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pt-1">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/25">
                {rootUser.name ? rootUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900">{rootUser.name || 'User'}</h2>
                  {rankInfo && (
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase bg-blue-100 text-blue-700 border border-blue-200">
                      {rankInfo.title}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium">{rootUser.email}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs">
                  <span className="text-blue-700 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                    Code: {rootUser.referralCode || 'N/A'}
                  </span>
                  <span className="text-slate-600 font-semibold flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    {rootUser.fairCoinBalance?.toLocaleString() || 0} Coins
                  </span>
                </div>
              </div>
            </div>

            {/* Total Network Stats */}
            <div className="flex items-center gap-4 bg-slate-50/90 p-4 rounded-2xl border border-slate-200/80">
              <div className="text-center px-3 border-r border-slate-200">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Total Downline</p>
                <p className="text-xl font-black text-blue-600 font-mono">{stats?.totalReferrals || 0}</p>
              </div>
              <div className="text-center px-3 border-r border-slate-200">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Direct (L1)</p>
                <p className="text-xl font-black text-slate-900 font-mono">{stats?.level1Count || 0}</p>
              </div>
              <div className="text-center px-3">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Multiplier</p>
                <p className="text-xl font-black text-emerald-600 font-mono">{rankInfo?.multiplier || 1.0}x</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('tree')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
            activeTab === 'tree'
              ? 'bg-blue-600 text-white shadow-blue-500/20'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>9-Level Downline Explorer</span>
        </button>

        <button
          onClick={() => setActiveTab('commissions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
            activeTab === 'commissions'
              ? 'bg-blue-600 text-white shadow-blue-500/20'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Recent MLM Payouts ({commissions.length})</span>
        </button>
      </div>

      {activeTab === 'tree' ? (
        <div className="space-y-6">
          {/* Level Selector Pills */}
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
              const count = stats ? stats[`level${lvl}Count`] || 0 : 0;
              const isSelected = selectedLevel === lvl;

              return (
                <motion.button
                  key={lvl}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white border-slate-200 hover:bg-blue-50/50 hover:border-blue-200 text-slate-700 shadow-sm'
                  }`}
                >
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                    Level {lvl}
                  </span>
                  <span className="text-base font-black font-mono mt-0.5">{count}</span>
                  <span className={`text-[9px] font-semibold ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>members</span>
                </motion.button>
              );
            })}
          </div>

          {/* Level Members Grid */}
          <motion.div
            variants={itemVariants}
            className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                  Level {selectedLevel} Downline Members
                </h3>
                <p className="text-xs text-slate-500">
                  Showing all direct or indirect participants in this user's downline tree at depth {selectedLevel}.
                </p>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Total: {tree[`level${selectedLevel}`]?.length || 0}
              </span>
            </div>

            {(!tree[`level${selectedLevel}`] || tree[`level${selectedLevel}`].length === 0) ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                No members found at Level {selectedLevel} for this user.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {tree[`level${selectedLevel}`].map((member) => (
                  <motion.div
                    key={member._id}
                    whileHover={{ y: -2 }}
                    className="p-4 bg-slate-50/80 border border-slate-200/70 hover:border-blue-300 hover:bg-white rounded-2xl transition-all shadow-sm flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{member.name || 'Anonymous'}</p>
                        <p className="text-[11px] text-slate-500 truncate">{member.email}</p>
                        <p className="text-[10px] text-blue-600 font-mono font-semibold mt-0.5">
                          Ref: {member.referralCode || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => loadNetwork(member.email)}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 shadow-sm transition"
                      title="Inspect this user's downline tree"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      ) : (
        /* Recent Commissions Table */
        <motion.div
          variants={itemVariants}
          className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm"
        >
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">MLM Commission Ledger</h3>
            <p className="text-xs text-slate-500">
              Audit log of distributed referral bonuses and 9-level vendor subscription upline earnings.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Beneficiary</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Origin Store / Source</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">Commission Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commissions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      No MLM commissions recorded yet.
                    </td>
                  </tr>
                ) : (
                  commissions.map((comm) => (
                    <tr key={comm._id} className="hover:bg-blue-50/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{comm.recipientUserId?.name || 'User'}</div>
                        <div className="text-[11px] text-slate-500">{comm.recipientUserId?.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] font-semibold">
                        {comm.type === 'MLM_VENDOR_SUBSCRIPTION_COMMISSION' ? (
                          <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                            Vendor Sub
                          </span>
                        ) : (
                          <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                            Order Ref
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 font-bold rounded-full text-[10px]">
                          Level {comm.level || 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {comm.vendorId?.storeName || 'Direct Order'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono font-semibold">
                        {comm.commissionPercentage || 0}%
                      </td>
                      <td className="py-3.5 px-4 font-black text-emerald-600 text-sm font-mono">
                        ₹{(comm.commissionAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700">
                          {comm.status || 'PAID'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono">
                        {new Date(comm.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SuperAdminMLM;
