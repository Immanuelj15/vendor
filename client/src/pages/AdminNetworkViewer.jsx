import React, { useState } from 'react';
import api from '../services/api';
import { Loader2, Network, Search, Users } from 'lucide-react';

export const AdminNetworkViewer = () => {
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [network, setNetwork] = useState(null);
  const [error, setError] = useState('');

  const fetchNetwork = async (e) => {
    e.preventDefault();
    if (!userId) return;
    
    setLoading(true);
    setError('');
    try {
      // Find the user if they typed a referral code instead of ID
      let targetUserId = userId;
      if (userId.startsWith('BABU') || userId.startsWith('FK')) {
        const userRes = await api.get(`/admin/users?referralCode=${userId}`);
        if (userRes.data.data.users && userRes.data.data.users.length > 0) {
          targetUserId = userRes.data.data.users[0]._id;
        } else {
          throw new Error('User with this referral code not found');
        }
      }

      const res = await api.get(`/referrals/network-summary?userId=${targetUserId}`);
      setNetwork(res.data.data);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || e.message || 'Failed to fetch network');
      setNetwork(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
        <Network className="w-7 h-7 text-brand-400" />
        <span>9-Level Network Viewer</span>
      </h1>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 max-w-2xl">
        <form onSubmit={fetchNetwork} className="flex gap-3">
          <input 
            type="text"
            placeholder="Enter User ID or Referral Code (e.g. BABU1234)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="flex-1 bg-slate-800 text-slate-100 px-4 py-3 rounded-xl border border-slate-700 text-sm focus:outline-none"
          />
          <button 
            type="submit"
            disabled={loading}
            className="bg-brand-600 hover:bg-brand-500 text-white px-6 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Search</span>
          </button>
        </form>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>

      {network && (
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-400" />
            <span>Total Downline Members: {network.totalNetworkCount}</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(9)].map((_, i) => {
              const levelNum = i + 1;
              const count = network[`level${levelNum}Count`] || 0;
              return (
                <div key={levelNum} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col items-center justify-center space-y-2">
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Level {levelNum}</div>
                  <div className="text-3xl font-extrabold text-white">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
