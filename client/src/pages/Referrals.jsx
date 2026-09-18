import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Share2,
  Copy,
  Check,
  Award,
  Trophy,
  BarChart3,
  QrCode,
  Download,
  MessageSquare,
  Zap,
  Network,
  Sparkles,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const Referrals = () => {
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Broadcast Message State
  const [msgTitle, setMsgTitle] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [messages, setMessages] = useState([]);
  const [sendingMsg, setSendingMsg] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    setLoading(true);
    try {
      const [treeRes, msgRes] = await Promise.all([
        api.get('/referrals/tree'),
        api.get('/referrals/team-messages').catch(() => ({ data: { data: { messages: [] } } })),
      ]);
      setData(treeRes.data.data);
      setMessages(msgRes.data.data.messages || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const referralCode = data?.user?.referralCode || 'YOUR_CODE';
  const clientUrl = window.location.origin;
  const referralLink = `${clientUrl}/register?ref=${referralCode}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(referralLink)}&color=1d4ed8&bgcolor=ffffff`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendTeamMsg = async (e) => {
    e.preventDefault();
    if (!msgTitle || !msgBody) return;
    setSendingMsg(true);
    try {
      await api.post('/referrals/team-message', { title: msgTitle, message: msgBody });
      alert('Broadcast announcement sent to your Level 1 downline team!');
      setMsgTitle('');
      setMsgBody('');
      fetchReferralData();
    } catch (err) {
      alert('Failed to send broadcast message');
    } finally {
      setSendingMsg(false);
    }
  };

  const rankInfo = data?.rankInfo || { rank: 'BRONZE', title: 'Bronze Partner', multiplier: 1.0, badgeColor: '#2563eb' };

  const chartData = [
    { level: 'Level 1 (Direct)', count: data?.stats?.level1Count || 0, earnings: (data?.stats?.level1Count || 0) * 50 },
    { level: 'Level 2 (Secondary)', count: data?.stats?.level2Count || 0, earnings: (data?.stats?.level2Count || 0) * 25 },
    { level: 'Level 3 (Tertiary)', count: data?.stats?.level3Count || 0, earnings: (data?.stats?.level3Count || 0) * 10 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* 2x Flash Boost Campaign Banner */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">Flash Boost Event Active</div>
            <div className="text-sm font-bold text-amber-900">Double Coins Weekend! Earn 2x Fair Coins on all Level 1 signups.</div>
          </div>
        </div>
      </div>

      {/* Hero Link Generator & Leadership Rank Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-slate-200/80 p-8 rounded-3xl space-y-5 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Multi-Level Referral Hierarchy</span>
          </div>

          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Invite Partners. Build Network. Earn Lifetime Rewards.
          </h1>

          {/* Link Copy Bar */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-2xl">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="w-full bg-transparent text-xs text-blue-700 font-mono font-bold px-3 focus:outline-none"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 transition-all shadow-xs"
            >
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Leadership Rank Card */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Leadership Rank</span>
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <span className="text-blue-600">★ {rankInfo.title}</span>
            </div>
            <div className="text-xs text-blue-700 font-bold">
              +{((rankInfo.multiplier - 1) * 100).toFixed(0)}% Bonus Coins Multiplier ({rankInfo.multiplier}x)
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Progress to Next Rank</span>
              <span>{data?.stats?.level1Count || 0} / {rankInfo.nextRankAt || 10} Directs</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${Math.min(100, ((data?.stats?.level1Count || 0) / (rankInfo.nextRankAt || 10)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* QR Code & Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Downloadable QR Code */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl text-center space-y-4 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 flex items-center justify-center gap-2">
            <QrCode className="w-4 h-4 text-blue-600" />
            <span>Referral QR Code</span>
          </h3>

          <div className="w-44 h-44 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs mx-auto">
            <img src={qrCodeUrl} alt="Referral QR Code" className="w-full h-full rounded-xl" />
          </div>

          <a
            href={qrCodeUrl}
            target="_blank"
            rel="noreferrer"
            download="FairKart-Referral-QR.png"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download QR Image</span>
          </a>
        </div>

        {/* Analytics Chart */}
        <div className="md:col-span-2 bg-white border border-slate-200/80 p-6 rounded-3xl space-y-4 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>Multi-Level Network Earnings Analytics</span>
          </h3>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="level" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} name="Members" />
                <Bar dataKey="earnings" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Estimated Coins" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Leaderboard & Team Broadcast Messaging */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top 5 Leaderboard */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-4 shadow-sm">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>Top 5 Network Builders Leaderboard</span>
          </h3>

          <div className="space-y-2">
            {data?.leaderboard?.map((item, index) => (
              <div key={item._id} className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 font-black flex items-center justify-center">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{item.name}</div>
                    <div className="text-[10px] font-mono text-slate-500">{item.referralCode}</div>
                  </div>
                </div>

                <div className="text-right font-black text-blue-600">
                  {item.directCount} Direct Referrals
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Broadcast Messaging Form */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-4 shadow-sm">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span>Team Broadcast Announcement</span>
          </h3>

          <form onSubmit={handleSendTeamMsg} className="space-y-3">
            <input
              type="text"
              required
              placeholder="Announcement Subject"
              value={msgTitle}
              onChange={(e) => setMsgTitle(e.target.value)}
              className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
            <textarea
              required
              placeholder="Message body to your Level 1 direct team..."
              value={msgBody}
              onChange={(e) => setMsgBody(e.target.value)}
              className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white h-20"
            />
            <button
              type="submit"
              disabled={sendingMsg}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all"
            >
              {sendingMsg ? 'Sending...' : 'Send Broadcast to Team'}
            </button>
          </form>

          {/* Received Messages */}
          {messages.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="text-xs font-bold text-slate-800">Announcements From Your Upline Sponsor:</div>
              {messages.map((m) => (
                <div key={m._id} className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl space-y-1 text-xs">
                  <div className="font-bold text-blue-900">{m.title}</div>
                  <div className="text-slate-600">{m.message}</div>
                  <div className="text-[10px] text-slate-400">From: {m.senderUserId?.name} ({m.senderUserId?.referralCode})</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Visual 3-Level MLM Referral Tree */}
      <div className="bg-white border border-slate-200/80 p-8 rounded-3xl space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-600" />
            <span>Interactive MLM Referral Hierarchy Tree</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">3 Configured Upline/Downline Levels</span>
        </div>

        {/* Tree Root & Branches */}
        <div className="space-y-8 py-4">
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl shadow-md shadow-blue-500/20 text-center">
              <div className="text-[10px] uppercase font-bold text-blue-200">Network Root</div>
              <div className="text-sm font-black">{data?.user?.name || 'YOU'}</div>
              <div className="text-[11px] font-mono text-blue-100">{data?.user?.referralCode}</div>
            </div>
          </div>

          <div className="w-0.5 h-6 bg-slate-200 mx-auto" />

          <div className="space-y-3">
            <div className="text-center text-xs font-bold text-blue-600 uppercase tracking-wider">
              Level 1 Direct Referrals ({data?.tree?.level1?.length || 0})
            </div>

            {data?.tree?.level1?.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-2">No direct referrals yet. Share your referral link above!</div>
            ) : (
              <div className="flex flex-wrap justify-center gap-4">
                {data?.tree?.level1?.map((refUser) => (
                  <div key={refUser._id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center min-w-36 shadow-xs">
                    <div className="text-xs font-bold text-slate-900">{refUser.name}</div>
                    <div className="text-[10px] font-mono text-slate-500">{refUser.referralCode}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Referrals;
