import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Check,
  X,
  Building2,
  MapPin,
  Search,
  Mail,
  Phone,
  BookOpen,
  Clock,
  ShieldAlert,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminVendorReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vendorData, setVendorData] = useState(null);

  // Modals and Action States
  const [rejectReason, setRejectReason] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(null); // 'APPROVED', 'REJECTED', 'SUSPENDED'
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');

  // Individual Doc Review States
  const [showDocReview, setShowDocReview] = useState(null);
  const [docRejectReason, setDocRejectReason] = useState('');

  useEffect(() => {
    fetchVendor();
    fetchNotes();
  }, [id]);

  const fetchVendor = async () => {
    try {
      const res = await api.get(`/admin/vendors/${id}`);
      setVendorData(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const res = await api.get(`/admin/vendors/${id}/internal-notes`);
      setNotes(res.data.data.notes || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      const body = { status: showStatusModal };
      if (showStatusModal === 'REJECTED' || showStatusModal === 'SUSPENDED') {
        if (!rejectReason) return alert('Reason is required');
        body.reason = rejectReason;
      }

      await api.put(`/admin/vendors/${id}/status`, body);
      setShowStatusModal(null);
      setRejectReason('');
      fetchVendor();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      await api.post(`/admin/vendors/${id}/internal-notes`, { note: newNote });
      setNewNote('');
      fetchNotes();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add note');
    }
  };

  const handleVerifyDocument = async (docType, status) => {
    if (status === 'REJECTED' && !docRejectReason) return alert('Reason required');
    try {
      await api.put(`/admin/vendors/${id}/documents/${docType}/verify`, { status, reason: docRejectReason });
      setShowDocReview(null);
      setDocRejectReason('');
      fetchVendor();
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed');
    }
  };

  const handleVerifyBank = async (status) => {
    if (status === 'REJECTED' && !docRejectReason) return alert('Reason required');
    try {
      await api.put(`/admin/vendors/${id}/bank/verify`, { status, reason: docRejectReason });
      setShowDocReview(null);
      setDocRejectReason('');
      fetchVendor();
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed');
    }
  };

  if (loading || !vendorData) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-3">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Loading vendor KYC dossier...</p>
      </div>
    );
  }

  const { vendor, business, location, kyc, bank, statusHistory } = vendorData;

  const renderStatusBadge = (status) => {
    if (status === 'VERIFIED' || status === 'APPROVED') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
          {status}
        </span>
      );
    }
    if (status === 'REJECTED') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
          {status}
        </span>
      );
    }
    if (status === 'SUSPENDED') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
          {status}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
        {status || 'PENDING'}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6 pb-20"
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-6 sm:p-7 rounded-3xl shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/vendors')}
            className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl border border-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
              <Building2 className="w-7 h-7 text-blue-600" />
              <span>{vendor.storeName}</span>
            </h1>
            <div className="flex items-center gap-3 mt-1.5">
              {renderStatusBadge(vendor.status)}
              <span className="text-xs text-slate-500 font-semibold">
                KYC: {renderStatusBadge(vendor.kycStatus)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {vendor.status !== 'APPROVED' && (
            <button
              onClick={() => setShowStatusModal('APPROVED')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" /> Approve Store
            </button>
          )}
          {vendor.status !== 'REJECTED' && (
            <button
              onClick={() => setShowStatusModal('REJECTED')}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-rose-500/20 flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" /> Reject Store
            </button>
          )}
          {vendor.status === 'APPROVED' && (
            <button
              onClick={() => setShowStatusModal('SUSPENDED')}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-purple-500/20 flex items-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4" /> Suspend
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Docs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identity Info */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Personal & Business Information</span>
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Owner Name</p>
                <p className="text-base font-bold text-slate-900 mt-0.5">{vendor.userId?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Contact</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">
                  {vendor.userId?.email} / {vendor.phone}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Business Type</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{business?.businessType || 'General Retail'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">GST Registered</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{business?.gstNumber || 'Not Registered'}</p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span>Physical Store Location</span>
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-2">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Full Address</p>
                <p className="text-sm text-slate-800 font-medium mt-0.5">{location?.fullAddress || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Taluk / Area</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{location?.talukArea?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">PIN Code</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{location?.pincode || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Documents Review */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Search className="w-5 h-5 text-blue-600" />
              <span>Document Verification</span>
            </h3>

            {/* Identity Doc */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-4 rounded-2xl border border-slate-200/70 gap-4">
              <div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Identity Proof ({kyc?.identityDocumentType})</span>
                  {renderStatusBadge(kyc?.identityDocumentStatus)}
                </div>
                <div className="text-xs text-slate-500 mt-1">Number: {kyc?.identityDocumentNumber}</div>
                {kyc?.identityDocumentReason && (
                  <div className="text-xs text-rose-600 mt-1 italic font-medium">
                    Reason: {kyc.identityDocumentReason}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {kyc?.identityDocumentUpload && (
                  <a
                    href={kyc.identityDocumentUpload}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
                  >
                    View Doc
                  </a>
                )}
                <button
                  onClick={() => setShowDocReview('identity')}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Verify
                </button>
              </div>
            </div>

            {/* PAN Doc */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-4 rounded-2xl border border-slate-200/70 gap-4">
              <div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>PAN Card</span>
                  {renderStatusBadge(kyc?.panDocumentStatus)}
                </div>
                <div className="text-xs text-slate-500 mt-1">Number: {business?.panNumber || 'N/A'}</div>
                {kyc?.panDocumentReason && (
                  <div className="text-xs text-rose-600 mt-1 italic font-medium">
                    Reason: {kyc.panDocumentReason}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {kyc?.panDocumentUpload && (
                  <a
                    href={kyc.panDocumentUpload}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
                  >
                    View Doc
                  </a>
                )}
                <button
                  onClick={() => setShowDocReview('pan')}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Verify
                </button>
              </div>
            </div>

            {/* Bank Proof */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-4 rounded-2xl border border-slate-200/70 gap-4">
              <div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Bank Account</span>
                  {renderStatusBadge(bank?.verificationStatus)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {bank?.bankName} - {bank?.accountNumber} ({bank?.ifscCode})
                </div>
                {bank?.rejectionReason && (
                  <div className="text-xs text-rose-600 mt-1 italic font-medium">
                    Reason: {bank.rejectionReason}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {bank?.bankProofUpload && (
                  <a
                    href={bank.bankProofUpload}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
                  >
                    View Doc
                  </a>
                )}
                <button
                  onClick={() => setShowDocReview('bank')}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Notes & History */}
        <div className="space-y-6">
          {/* Internal Notes */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col h-[400px]">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>Internal Admin Notes</span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 mb-4">
              {notes.length === 0 ? (
                <div className="text-xs text-slate-400 text-center mt-12">No internal notes added yet.</div>
              ) : (
                notes.map((note) => (
                  <div key={note._id} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
                    <p className="text-xs text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">{note.note}</p>
                    <div className="text-[10px] text-slate-400 mt-2 font-bold flex justify-between">
                      <span>{note.adminId?.name || 'Admin'}</span>
                      <span>{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddNote} className="mt-auto">
              <textarea
                placeholder="Add confidential audit note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 p-3 rounded-xl focus:outline-none focus:border-blue-600 resize-none h-20 mb-2 font-medium"
              ></textarea>
              <button
                type="submit"
                disabled={!newNote.trim()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-blue-500/20"
              >
                Add Internal Note
              </button>
            </form>
          </div>

          {/* Status History */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Status Audit Log</span>
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {!statusHistory || statusHistory.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-4">No status transitions recorded.</div>
              ) : (
                statusHistory.map((sh) => (
                  <div key={sh._id} className="border-l-2 border-blue-600 pl-3 py-1">
                    <div className="text-[10px] text-slate-400">{new Date(sh.createdAt).toLocaleString()}</div>
                    <div className="text-xs font-bold text-slate-800 mt-0.5">
                      <span className="text-slate-500">{sh.previousStatus}</span> &rarr;{' '}
                      <span className="text-blue-600">{sh.newStatus}</span>
                    </div>
                    {sh.reason && <div className="text-xs text-rose-600 mt-0.5 italic">"{sh.reason}"</div>}
                    <div className="text-[10px] text-slate-500 mt-0.5">By: {sh.changedBy?.name || 'System Admin'}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 p-6 sm:p-7 rounded-3xl max-w-md w-full shadow-2xl"
          >
            <h2 className="text-lg font-black text-slate-900 mb-1">Confirm Status Change: {showStatusModal}</h2>
            <p className="text-xs sm:text-sm text-slate-600 mb-4">
              Are you sure you want to update this merchant account status to <strong>{showStatusModal}</strong>?
            </p>

            {(showStatusModal === 'REJECTED' || showStatusModal === 'SUSPENDED') && (
              <textarea
                className="w-full bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 p-3 rounded-xl mb-4 focus:outline-none focus:border-blue-600 font-medium"
                rows="3"
                placeholder="Reason is required for rejection/suspension..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              ></textarea>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowStatusModal(null);
                  setRejectReason('');
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-500/20"
              >
                Confirm Update
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Doc Review Modal */}
      {showDocReview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 p-6 sm:p-7 rounded-3xl max-w-md w-full shadow-2xl"
          >
            <h2 className="text-lg font-black text-slate-900 mb-1 capitalize">Verify {showDocReview} Document</h2>
            <p className="text-xs text-slate-500">Provide rejection notes if rejecting this document.</p>

            <textarea
              className="w-full bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 p-3 rounded-xl mb-4 focus:outline-none focus:border-blue-600 font-medium mt-4"
              rows="3"
              placeholder="Reason (Optional for approve, required for reject)..."
              value={docRejectReason}
              onChange={(e) => setDocRejectReason(e.target.value)}
            ></textarea>

            <div className="flex justify-between gap-3">
              <button
                onClick={() => {
                  setShowDocReview(null);
                  setDocRejectReason('');
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    showDocReview === 'bank'
                      ? handleVerifyBank('REJECTED')
                      : handleVerifyDocument(showDocReview, 'REJECTED')
                  }
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-all"
                >
                  Reject Doc
                </button>
                <button
                  onClick={() =>
                    showDocReview === 'bank'
                      ? handleVerifyBank('VERIFIED')
                      : handleVerifyDocument(showDocReview, 'VERIFIED')
                  }
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20"
                >
                  Verify & Approve
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminVendorReview;
