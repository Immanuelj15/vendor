import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Loader2, Settings2, Save, CheckCircle } from 'lucide-react';

export const AdminNetworkSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    required_direct_members: 6,
    network_threshold_low: 2,
    network_threshold_medium: 4,
    network_threshold_complete: 6
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/settings');
      const networkSettings = res.data.data.settings.find(s => s.key === 'NETWORK_SETTINGS')?.value;
      if (networkSettings) {
        setFormData({
          required_direct_members: networkSettings.required_direct_members || 6,
          network_threshold_low: networkSettings.network_threshold_low || 2,
          network_threshold_medium: networkSettings.network_threshold_medium || 4,
          network_threshold_complete: networkSettings.network_threshold_complete || 6
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.put('/admin/settings', {
        key: 'NETWORK_SETTINGS',
        value: {
          required_direct_members: Number(formData.required_direct_members),
          network_threshold_low: Number(formData.network_threshold_low),
          network_threshold_medium: Number(formData.network_threshold_medium),
          network_threshold_complete: Number(formData.network_threshold_complete)
        }
      });
      setMessage('Settings saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
        <Settings2 className="w-7 h-7 text-brand-400" />
        <span>Network Configuration</span>
      </h1>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
        {message && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-xs">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Required Direct Members (Goal)</label>
              <input
                type="number"
                min="1"
                required
                value={formData.required_direct_members}
                onChange={(e) => setFormData({ ...formData, required_direct_members: e.target.value })}
                className="w-full bg-slate-800 text-slate-100 px-4 py-3 rounded-xl border border-slate-700 text-sm focus:outline-none"
              />
              <p className="text-[10px] text-slate-500">The total target of direct referrals a vendor must bring.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Threshold - Low (Amber)</label>
              <input
                type="number"
                min="0"
                required
                value={formData.network_threshold_low}
                onChange={(e) => setFormData({ ...formData, network_threshold_low: e.target.value })}
                className="w-full bg-slate-800 text-slate-100 px-4 py-3 rounded-xl border border-slate-700 text-sm focus:outline-none"
              />
              <p className="text-[10px] text-slate-500">Number of members required to reach "Low" status indicator.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Threshold - Medium (Blue)</label>
              <input
                type="number"
                min="0"
                required
                value={formData.network_threshold_medium}
                onChange={(e) => setFormData({ ...formData, network_threshold_medium: e.target.value })}
                className="w-full bg-slate-800 text-slate-100 px-4 py-3 rounded-xl border border-slate-700 text-sm focus:outline-none"
              />
              <p className="text-[10px] text-slate-500">Number of members required to reach "Medium" status indicator.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Threshold - Complete (Green)</label>
              <input
                type="number"
                min="0"
                required
                value={formData.network_threshold_complete}
                onChange={(e) => setFormData({ ...formData, network_threshold_complete: e.target.value })}
                className="w-full bg-slate-800 text-slate-100 px-4 py-3 rounded-xl border border-slate-700 text-sm focus:outline-none"
              />
              <p className="text-[10px] text-slate-500">Number of members required to reach "Complete" status indicator.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-brand-600 hover:bg-brand-500 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
