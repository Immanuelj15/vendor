import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
  Navigation,
} from 'lucide-react';

export const DeliveryDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [failureReason, setFailureReason] = useState('');

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/deliveries/my');
      setAssignments(res.data.data.assignments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      await api.put(`/deliveries/${selectedAssignment._id}/status`, {
        status,
        recipientName,
        deliveryNote,
        failureReason,
      });
      alert(`Status updated to ${status} successfully!`);
      setShowStatusModal(false);
      setSelectedAssignment(null);
      setRecipientName('');
      setDeliveryNote('');
      setFailureReason('');
      fetchAssignments();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update delivery status');
    }
  };

  if (loading && assignments.length === 0) {
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
          <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-lg">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Delivery Rider Console</h1>
            <p className="text-xs text-slate-400">Manage and track your active order assignments</p>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
        <h3 className="font-bold text-sm text-white">Your Delivery Shipments</h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-xs text-slate-500 py-12 text-center">No active deliveries assigned yet.</div>
        ) : (
          <div className="space-y-4">
            {assignments.map((a) => (
              <div key={a._id} className="bg-slate-850 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-white">Assignment ID: {a._id}</div>
                  <div className="text-slate-400">Tracking Code: {a.packageId?.trackingNumber || 'Awaiting PKG'}</div>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300 mt-1">
                    {a.status}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedAssignment(a);
                      setShowStatusModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition text-xs shadow-lg shadow-brand-600/20"
                  >
                    Update State
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Update Status Modal */}
      {showStatusModal && selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-md space-y-4">
            <h3 className="font-bold text-lg text-white">Update Delivery Status</h3>
            <p className="text-xs text-slate-400">Current Status: {selectedAssignment.status}</p>

            <div className="flex flex-col gap-2 pt-2">
              {selectedAssignment.status === 'ASSIGNED' && (
                <button
                  onClick={() => handleUpdateStatus('ACCEPTED')}
                  className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-550 text-white text-xs font-bold"
                >
                  Accept Assignment
                </button>
              )}

              {selectedAssignment.status === 'ACCEPTED' && (
                <button
                  onClick={() => handleUpdateStatus('PICKED_UP')}
                  className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-550 text-white text-xs font-bold"
                >
                  Confirm Hub Pickup
                </button>
              )}

              {selectedAssignment.status === 'PICKED_UP' && (
                <button
                  onClick={() => handleUpdateStatus('OUT_FOR_DELIVERY')}
                  className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-550 text-white text-xs font-bold"
                >
                  Set Out For Delivery
                </button>
              )}

              {selectedAssignment.status === 'OUT_FOR_DELIVERY' && (
                <div className="space-y-3 pt-2">
                  <div className="border-t border-slate-800/80 pt-3 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400">Recipient Proof of Delivery</span>
                    <input
                      type="text"
                      placeholder="Recipient Name"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full bg-slate-800 text-xs text-white rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Delivery Notes"
                      value={deliveryNote}
                      onChange={(e) => setDeliveryNote(e.target.value)}
                      className="w-full bg-slate-800 text-xs text-white rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus('DELIVERED')}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-550 text-white text-xs font-bold"
                    >
                      Confirm Delivered
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Please enter failure reason:');
                        if (reason) {
                          setFailureReason(reason);
                          handleUpdateStatus('FAILED');
                        }
                      }}
                      className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-550 text-white text-xs font-bold"
                    >
                      Fail Delivery
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowStatusModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold mt-2"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
