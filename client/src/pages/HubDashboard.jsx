import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Package,
  Home,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Loader2,
  MapPin,
  Barcode,
} from 'lucide-react';

export const HubDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [receiveFulfillmentId, setReceiveFulfillmentId] = useState('');
  const [selectedHubId, setSelectedHubId] = useState('');
  const [hubsList, setHubsList] = useState([]);

  useEffect(() => {
    fetchHubData();
  }, [selectedHubId]);

  const fetchHubData = async () => {
    setLoading(true);
    try {
      // Fetch hubs to select
      const hubsRes = await api.get('/hubs');
      const hubs = hubsRes.data.data.hubs || [];
      setHubsList(hubs);

      const hubId = selectedHubId || hubs?.[0]?._id;
      if (hubId) {
        setSelectedHubId(hubId);
        // Fetch fulfillments for this hub that are packed
        const res = await api.get(`/fulfillments/admin/fulfillment?status=PACKED&hubId=${hubId}`);
        setData(res.data.data.fulfillments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReceivePackage = async (e) => {
    e.preventDefault();
    if (!receiveFulfillmentId) {
      alert('Please enter a valid package/fulfillment ID');
      return;
    }
    try {
      await api.put(`/fulfillments/hubs/fulfillments/${receiveFulfillmentId}/receive`, {
        hubId: selectedHubId,
      });
      alert('Package scanned and received successfully at Hub!');
      setReceiveFulfillmentId('');
      fetchHubData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to scan/receive package');
    }
  };

  if (loading && hubsList.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-lg">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Hub Fulfillment Dashboard</h1>
            <p className="text-xs text-slate-400">Receive, sort, and dispatch package consignments</p>
          </div>
        </div>

        <div>
          <select
            value={selectedHubId}
            onChange={(e) => setSelectedHubId(e.target.value)}
            className="bg-slate-800 text-xs text-white rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none"
          >
            {hubsList.map((hub) => (
              <option key={hub._id} value={hub._id}>
                {hub.name} ({hub.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid: Scan Package & Incoming Consignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Scan/Receive Form */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 h-fit">
          <h3 className="font-bold text-sm text-white flex items-center gap-1.5 border-b border-slate-800 pb-3">
            <Barcode className="w-4 h-4 text-brand-400" />
            <span>Scan/Receive Package</span>
          </h3>

          <form onSubmit={handleReceivePackage} className="space-y-4">
            <input
              type="text"
              required
              placeholder="Fulfillment ID (FK-...)"
              value={receiveFulfillmentId}
              onChange={(e) => setReceiveFulfillmentId(e.target.value)}
              className="w-full bg-slate-800 text-xs text-white rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow-lg shadow-brand-600/20"
            >
              Scan & Receive
            </button>
          </form>
        </div>

        {/* Incoming/Packed packages list */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
            <Package className="w-4 h-4 text-brand-400" />
            <span>Incoming Packages (Awaiting Scan)</span>
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-xs text-slate-500 py-12 text-center">No incoming packed packages found.</div>
          ) : (
            <div className="space-y-3">
              {data.map((f) => (
                <div key={f._id} className="bg-slate-850 p-4 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">Order: #{f.orderId?.orderNumber}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Fulfillment ID: {f._id}</div>
                  </div>
                  <button
                    onClick={() => {
                      setReceiveFulfillmentId(f._id);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition text-[10px]"
                  >
                    Select to scan
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
