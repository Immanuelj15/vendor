import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Loader2, Users, Network, Copy, CheckCircle2, AlertCircle, Share2, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export const VendorNetworkDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [network, setNetwork] = useState(null);
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchNetwork();
  }, []);

  const fetchNetwork = async () => {
    setLoading(true);
    try {
      const [netRes, linkRes, settingsRes] = await Promise.all([
        api.get('/referrals/network-summary'),
        api.get('/referrals/my-link'),
        api.get('/admin/settings'),
      ]);

      const networkSettings = settingsRes.data.data.settings.find((s) => s.key === 'NETWORK_SETTINGS')?.value || {
        required_direct_members: 6,
        network_threshold_low: 2,
        network_threshold_medium: 4,
        network_threshold_complete: 6,
      };

      setSettings(networkSettings);

      setNetwork({
        stats: netRes.data.data,
        link: linkRes.data.data,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (network?.link?.referralLink) {
      navigator.clipboard.writeText(network.link.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Loading network referral metrics...</p>
      </div>
    );
  }

  const directMembers = network?.stats?.level1Count || 0;
  const requiredMembers = settings?.required_direct_members || 6;
  const progress = Math.min(100, Math.round((directMembers / requiredMembers) * 100));

  let statusBadge = 'bg-rose-50 text-rose-700 border-rose-200';
  let statusText = 'Low Activity';
  let progressColor = 'bg-rose-500';
  if (directMembers >= (settings?.network_threshold_complete || 6)) {
    statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    statusText = 'Goal Complete';
    progressColor = 'bg-emerald-500';
  } else if (directMembers >= (settings?.network_threshold_medium || 4)) {
    statusBadge = 'bg-blue-50 text-blue-700 border-blue-200';
    statusText = 'Good Progress';
    progressColor = 'bg-blue-600';
  } else if (directMembers >= (settings?.network_threshold_low || 2)) {
    statusBadge = 'bg-amber-50 text-amber-700 border-amber-200';
    statusText = 'Getting Started';
    progressColor = 'bg-amber-500';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-8"
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Network className="w-5 h-5" />
          </div>
          <span>Merchant Referral Network</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Monitor your 9-level distributor downline and track referral commissions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Referral Link Card */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 sm:p-7 rounded-3xl shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-600" />
            <span>Your Merchant Invite Link</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            Share this link to invite retail stores and fellow vendors into your direct affiliate team.
          </p>

          <div className="flex items-center gap-2 mt-3">
            <input
              type="text"
              readOnly
              value={network?.link?.referralLink || ''}
              className="flex-1 bg-slate-50 text-slate-800 px-4 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none font-medium"
            />
            <button
              onClick={copyToClipboard}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl transition-all font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="pt-2 text-xs sm:text-sm text-slate-500">
            Direct Code: <strong className="text-blue-600 font-mono text-sm">{network?.link?.referralCode}</strong>
          </div>
        </div>

        {/* Network Goal Card */}
        <div className="bg-white border border-slate-200/80 p-6 sm:p-7 rounded-3xl shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Direct Goal</span>
            </h3>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusBadge}`}>
              {statusText}
            </span>
          </div>

          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-4xl font-black text-slate-900">{directMembers}</span>
            <span className="text-slate-500 text-sm font-medium">/ {requiredMembers} members</span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3 mt-3">
            <div className={`${progressColor} h-3 rounded-full transition-all`} style={{ width: `${progress}%` }}></div>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-start gap-1.5 leading-relaxed">
            <AlertCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <span>Visual target helping you expand your community network. Does not restrict normal store operations.</span>
          </p>
        </div>
      </div>

      {/* Network Levels Grid */}
      <div className="space-y-4">
        <h3 className="font-bold text-base text-slate-900">9-Level Downline Overview</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(9)].map((_, i) => {
            const levelNum = i + 1;
            const count = network?.stats?.[`level${levelNum}Count`] || 0;
            return (
              <div
                key={levelNum}
                className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col items-center justify-center space-y-1.5 shadow-xs hover:border-blue-300 transition-all"
              >
                <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Level {levelNum}</div>
                <div className="text-2xl font-black text-blue-600">{count}</div>
                <div className="flex items-center gap-1 text-slate-400 text-xs">
                  <Users className="w-3.5 h-3.5" />
                  <span>Members</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default VendorNetworkDashboard;
