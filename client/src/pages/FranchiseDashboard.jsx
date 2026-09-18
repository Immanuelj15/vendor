import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Loader2, Plus, Users, Landmark, MapPin, Percent, HelpCircle } from 'lucide-react';

export const FranchiseDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [franchises, setFranchises] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Form State
  const [formData, setFormData] = useState({
    userId: '',
    franchiseType: 'DISTRICT',
    territoryId: '',
    businessName: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const dbRes = await api.get('/franchises/null/dashboard');
      setDashboard(dbRes.data.data.dashboard);

      const fRes = await api.get('/franchises');
      setFranchises(fRes.data.data.franchises);

      const tRes = await api.get('/franchises/territories');
      setTerritories(tRes.data.data.territories);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAppoint = async (e) => {
    e.preventDefault();
    try {
      await api.post('/franchises', {
        ...formData,
        parentFranchiseId: franchises[0]?._id || null
      });
      alert('Franchise appointment initiated successfully! Pending admin approval.');
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Appointment failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
        <Landmark className="w-7 h-7 text-brand-400" />
        <span>Franchise Scoped Management Portal</span>
      </h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
          <div className="text-slate-400 text-xs font-semibold">Active Districts</div>
          <div className="text-3xl font-extrabold text-white">{dashboard?.districtCount ?? 0}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
          <div className="text-slate-400 text-xs font-semibold">Active Taluks</div>
          <div className="text-3xl font-extrabold text-white">{dashboard?.talukCount ?? 0}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
          <div className="text-slate-400 text-xs font-semibold">Managed Shops</div>
          <div className="text-3xl font-extrabold text-white">{dashboard?.shopCount ?? 0}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
          <div className="text-slate-400 text-xs font-semibold">Shopkeepers Onboarded</div>
          <div className="text-3xl font-extrabold text-white">{dashboard?.shopkeeperCount ?? 0}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-xs font-semibold transition-all ${
            activeTab === 'overview' ? 'text-brand-400 border-b-2 border-brand-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          My Franchise Hierarchy
        </button>
        <button
          onClick={() => setActiveTab('appoint')}
          className={`pb-3 text-xs font-semibold transition-all ${
            activeTab === 'appoint' ? 'text-brand-400 border-b-2 border-brand-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Appoint New Franchise
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h3 className="font-bold text-sm text-white">Authorized Franchise Representatives</h3>
          {franchises.length === 0 ? (
            <div className="text-center text-xs text-slate-500 py-10">No franchises registered under your scope.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 pb-2">
                    <th className="py-2">Business Name</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Territory</th>
                    <th className="py-2">KYC</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {franchises.map((f) => (
                    <tr key={f._id} className="border-b border-slate-800/50 hover:bg-slate-800/10">
                      <td className="py-3.5 font-bold text-white">{f.businessName}</td>
                      <td className="py-3.5 text-slate-300">{f.franchiseType}</td>
                      <td className="py-3.5 text-slate-400">{f.territoryId?.name || 'Global'}</td>
                      <td className="py-3.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          f.kycStatus === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {f.kycStatus}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          f.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {f.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'appoint' && (
        <form onSubmit={handleAppoint} className="max-w-xl bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-brand-400" />
            <span>Initiate Lower-Level Franchise Appointment</span>
          </h3>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Operator User ID"
              required
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              className="w-full bg-slate-800 text-xs text-slate-100 rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none"
            />

            <select
              value={formData.franchiseType}
              onChange={(e) => setFormData({ ...formData, franchiseType: e.target.value })}
              className="w-full bg-slate-800 text-xs text-slate-100 rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none"
            >
              <option value="DISTRICT">DISTRICT FRANCHISE</option>
              <option value="TALUK">TALUK FRANCHISE</option>
            </select>

            <select
              required
              value={formData.territoryId}
              onChange={(e) => setFormData({ ...formData, territoryId: e.target.value })}
              className="w-full bg-slate-800 text-xs text-slate-100 rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none"
            >
              <option value="">Select Territory</option>
              {territories.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.type})
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Business Name"
              required
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="w-full bg-slate-800 text-xs text-slate-100 rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="tel"
                placeholder="Phone Number"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-800 text-xs text-slate-100 rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none"
              />
              <input
                type="email"
                placeholder="Email Address"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-800 text-xs text-slate-100 rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none"
              />
            </div>

            <textarea
              placeholder="Physical Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full h-20 bg-slate-800 text-xs text-slate-100 rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-all"
          >
            Confirm Appointment
          </button>
        </form>
      )}
    </div>
  );
};
