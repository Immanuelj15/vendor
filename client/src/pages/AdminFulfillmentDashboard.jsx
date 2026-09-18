import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Package,
  Home,
  RotateCcw,
  Truck,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  MapPin,
  ListFilter,
  UserCheck,
  Building2,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminFulfillmentDashboard = () => {
  const [activeTab, setActiveTab] = useState('fulfillments');
  const [loading, setLoading] = useState(true);

  // Tab Data
  const [fulfillments, setFulfillments] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [returns, setReturns] = useState([]);

  // Modal / Selection states
  const [showHubModal, setShowHubModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedFulfillmentId, setSelectedFulfillmentId] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');

  // Hub Form State
  const [hubForm, setHubForm] = useState({
    name: '',
    code: '',
    type: 'DISTRIBUTION_HUB',
    territoryId: '',
    address: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'fulfillments') {
        const res = await api.get('/fulfillments/admin/fulfillment');
        setFulfillments(res.data.data.fulfillments || []);
      } else if (activeTab === 'hubs') {
        const res = await api.get('/hubs');
        setHubs(res.data.data.hubs || []);
      } else if (activeTab === 'returns') {
        const res = await api.get('/returns/admin');
        setReturns(res.data.data.requests || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHub = async (e) => {
    e.preventDefault();
    try {
      const terRes = await api.get('/franchises/territories').catch(() => null);
      const terId = terRes?.data?.data?.[0]?._id || '660a12345678901234567890';

      await api.post('/hubs', {
        name: hubForm.name,
        code: hubForm.code,
        type: hubForm.type,
        territoryId: hubForm.territoryId || terId,
        address: hubForm.address,
        contact: {
          name: hubForm.contactName,
          phone: hubForm.contactPhone,
          email: hubForm.contactEmail,
        },
      });

      alert('Fulfillment Hub created successfully!');
      setShowHubModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create hub');
    }
  };

  const handleAssignPartner = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/deliveries/${selectedFulfillmentId}/assign`, {
        deliveryPartnerId: selectedPartnerId,
      });

      alert('Rider assigned successfully!');
      setShowAssignModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign rider');
    }
  };

  const handleUpdateReturn = async (reqId, status) => {
    try {
      await api.put(`/returns/admin/${reqId}/status`, {
        status,
        adminNote: 'Admin approved/rejected request',
      });
      alert(`Return request status updated to ${status}!`);
      fetchData();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update return request');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200/80 p-6 sm:p-7 rounded-3xl shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Truck className="w-5 h-5" />
            </div>
            <span>Fulfillment & Logistics Console</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Governing regional hub logistics, parcel routing, and return reverse workflows.
          </p>
        </div>

        {activeTab === 'hubs' && (
          <button
            onClick={() => setShowHubModal(true)}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Hub</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-8 text-sm font-bold">
        <button
          onClick={() => setActiveTab('fulfillments')}
          className={`pb-3.5 transition-all flex items-center gap-2 ${
            activeTab === 'fulfillments'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Orders Fulfillment</span>
        </button>
        <button
          onClick={() => setActiveTab('hubs')}
          className={`pb-3.5 transition-all flex items-center gap-2 ${
            activeTab === 'hubs'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Fulfillment Hubs</span>
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={`pb-3.5 transition-all flex items-center gap-2 ${
            activeTab === 'returns'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Return Requests</span>
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading logistics records...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tab Content: Fulfillments */}
          {activeTab === 'fulfillments' && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Package className="w-5 h-5 text-blue-600" />
                <span>Active Package Fulfillments</span>
              </h3>
              {fulfillments.length === 0 ? (
                <div className="text-sm text-slate-400 py-10 text-center">No active fulfillments found.</div>
              ) : (
                <div className="space-y-3.5">
                  {fulfillments.map((f) => (
                    <div
                      key={f._id}
                      className="bg-slate-50/70 border border-slate-200/70 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 text-base">Order: #{f.orderId?.orderNumber}</div>
                        <div className="text-slate-600 text-xs">
                          Source: {f.sourceType} ({f.sourceId})
                        </div>
                        <div className="text-slate-400 text-xs">Items: {f.items?.length || 0} unique items</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                          {f.status}
                        </span>

                        {['READY_FOR_DISPATCH', 'PACKED'].includes(f.status) && (
                          <button
                            onClick={() => {
                              setSelectedFulfillmentId(f._id);
                              setShowAssignModal(true);
                            }}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5"
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>Assign Rider</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Hubs */}
          {activeTab === 'hubs' && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span>Regional Warehouses & Sorting Hubs</span>
              </h3>
              {hubs.length === 0 ? (
                <div className="text-sm text-slate-400 py-10 text-center">No hubs configured yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {hubs.map((h) => (
                    <div
                      key={h._id}
                      className="bg-slate-50/70 border border-slate-200/70 p-5 rounded-2xl space-y-2.5 text-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-slate-900 text-base">{h.name}</div>
                          <div className="text-blue-600 font-mono text-xs font-bold mt-0.5">{h.code}</div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            h.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {h.status}
                        </span>
                      </div>
                      <div className="text-slate-600 leading-relaxed text-xs">{h.address}</div>
                      <div className="text-xs text-slate-500 pt-2 border-t border-slate-200 font-medium">
                        Type: {h.type} | Contact: {h.contact?.name} ({h.contact?.phone})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Returns */}
          {activeTab === 'returns' && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <RotateCcw className="w-5 h-5 text-blue-600" />
                <span>Customer Return Inquiries</span>
              </h3>
              {returns.length === 0 ? (
                <div className="text-sm text-slate-400 py-10 text-center">No return requests pending.</div>
              ) : (
                <div className="space-y-3.5">
                  {returns.map((r) => (
                    <div
                      key={r._id}
                      className="bg-slate-50/70 border border-slate-200/70 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 text-base">Order: #{r.orderId?.orderNumber}</div>
                        <div className="text-slate-700 font-medium text-xs">Customer: {r.customerId?.name}</div>
                        <div className="text-slate-500 text-xs italic">Reason: "{r.reason}"</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                          {r.status}
                        </span>

                        {r.status === 'REQUESTED' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateReturn(r._id, 'APPROVED')}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition text-xs shadow-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateReturn(r._id, 'REJECTED')}
                              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition text-xs shadow-xs"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Hub Creation Modal */}
      {showHubModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 p-6 sm:p-7 rounded-3xl w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <h3 className="font-black text-lg text-slate-900">Create Fulfillment Hub</h3>

            <form onSubmit={handleCreateHub} className="space-y-3.5">
              <input
                type="text"
                required
                placeholder="Hub / Warehouse Name"
                value={hubForm.name}
                onChange={(e) => setHubForm({ ...hubForm, name: e.target.value })}
                className="w-full bg-slate-50 text-sm text-slate-900 rounded-xl px-4 py-3 border border-slate-200 focus:outline-none focus:border-blue-600 font-medium"
              />
              <input
                type="text"
                required
                placeholder="Hub Code (e.g. HUB-BLR-01)"
                value={hubForm.code}
                onChange={(e) => setHubForm({ ...hubForm, code: e.target.value })}
                className="w-full bg-slate-50 text-sm text-slate-900 rounded-xl px-4 py-3 border border-slate-200 focus:outline-none focus:border-blue-600 font-medium"
              />
              <select
                value={hubForm.type}
                onChange={(e) => setHubForm({ ...hubForm, type: e.target.value })}
                className="w-full bg-slate-50 text-sm text-slate-900 rounded-xl px-4 py-3 border border-slate-200 focus:outline-none focus:border-blue-600 font-medium"
              >
                <option value="DISTRIBUTION_HUB">Distribution Hub</option>
                <option value="WAREHOUSE">Warehouse</option>
              </select>
              <textarea
                required
                placeholder="Full Physical Address"
                value={hubForm.address}
                onChange={(e) => setHubForm({ ...hubForm, address: e.target.value })}
                className="w-full bg-slate-50 text-sm text-slate-900 rounded-xl px-4 py-3 border border-slate-200 focus:outline-none focus:border-blue-600 font-medium h-20 resize-none"
              />
              <div className="border-t border-slate-100 pt-3 space-y-2.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Contact Person Details
                </span>
                <input
                  type="text"
                  required
                  placeholder="Contact Name"
                  value={hubForm.contactName}
                  onChange={(e) => setHubForm({ ...hubForm, contactName: e.target.value })}
                  className="w-full bg-slate-50 text-sm text-slate-900 rounded-xl px-4 py-3 border border-slate-200 focus:outline-none focus:border-blue-600 font-medium"
                />
                <input
                  type="text"
                  required
                  placeholder="Contact Phone"
                  value={hubForm.contactPhone}
                  onChange={(e) => setHubForm({ ...hubForm, contactPhone: e.target.value })}
                  className="w-full bg-slate-50 text-sm text-slate-900 rounded-xl px-4 py-3 border border-slate-200 focus:outline-none focus:border-blue-600 font-medium"
                />
                <input
                  type="email"
                  required
                  placeholder="Contact Email"
                  value={hubForm.contactEmail}
                  onChange={(e) => setHubForm({ ...hubForm, contactEmail: e.target.value })}
                  className="w-full bg-slate-50 text-sm text-slate-900 rounded-xl px-4 py-3 border border-slate-200 focus:outline-none focus:border-blue-600 font-medium"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHubModal(false)}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
                >
                  Create Hub
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Rider Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 p-6 sm:p-7 rounded-3xl w-full max-w-md space-y-4 shadow-2xl"
          >
            <h3 className="font-black text-lg text-slate-900">Assign Delivery Partner</h3>
            <p className="text-xs text-slate-600">Select a verified delivery partner for this package dispatch.</p>

            <form onSubmit={handleAssignPartner} className="space-y-4">
              <select
                required
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
                className="w-full bg-slate-50 text-sm text-slate-900 rounded-xl px-4 py-3 border border-slate-200 focus:outline-none focus:border-blue-600 font-medium"
              >
                <option value="">-- Select Delivery Partner --</option>
                <option value="660a11112222333344445555">Rider A (Alex)</option>
                <option value="660a55556666777788889999">Rider B (Bob)</option>
              </select>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
                >
                  Assign Package
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminFulfillmentDashboard;
