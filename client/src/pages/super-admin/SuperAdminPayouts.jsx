import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDownCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  CreditCard,
  Phone,
  Mail,
  RefreshCw,
  AlertCircle,
  Search,
  Check,
  X,
  DollarSign
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

export const SuperAdminPayouts = () => {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState([]);
  const [summary, setSummary] = useState({});
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [actionModal, setActionModal] = useState(null); // { type: 'APPROVE' | 'REJECT', payout }
  const [adminNotes, setAdminNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadPayouts = async (status = statusFilter) => {
    try {
      setLoading(true);
      setErrorMsg('');
      const params = {};
      if (status !== 'ALL') params.status = status;
      const res = await superAdminService.getPayoutRequests(params);
      if (res) {
        setPayouts(res.payouts || []);
        setSummary(res.summary || {});
      }
    } catch (err) {
      console.error('Failed to load payouts:', err);
      setErrorMsg('Failed to retrieve vendor payout requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayouts(statusFilter);
  }, [statusFilter]);

  const handleApprove = async () => {
    if (!actionModal?.payout) return;
    try {
      setProcessingId(actionModal.payout._id);
      setErrorMsg('');
      await superAdminService.approvePayoutRequest(actionModal.payout._id, { adminNotes });
      setSuccessMsg(`Payout of ₹${actionModal.payout.amount.toLocaleString('en-IN')} approved and disbursed.`);
      setActionModal(null);
      setAdminNotes('');
      loadPayouts(statusFilter);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Approve payout error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to approve payout');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!actionModal?.payout) return;
    if (!adminNotes.trim()) {
      setErrorMsg('A rejection reason is required');
      return;
    }
    try {
      setProcessingId(actionModal.payout._id);
      setErrorMsg('');
      await superAdminService.rejectPayoutRequest(actionModal.payout._id, { adminNotes });
      setSuccessMsg(`Payout of ₹${actionModal.payout.amount.toLocaleString('en-IN')} rejected. Funds returned to vendor balance.`);
      setActionModal(null);
      setAdminNotes('');
      loadPayouts(statusFilter);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Reject payout error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to reject payout');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredPayouts = payouts.filter((p) => {
    if (!search) return true;
    const store = p.vendorId?.storeName?.toLowerCase() || '';
    const name = p.vendorId?.userId?.name?.toLowerCase() || '';
    const email = p.vendorId?.userId?.email?.toLowerCase() || '';
    const q = search.toLowerCase();
    return store.includes(q) || name.includes(q) || email.includes(q);
  });

  const pendingCount = summary.PENDING?.count || 0;
  const pendingAmount = summary.PENDING?.amount || 0;
  const approvedAmount = summary.APPROVED?.amount || 0;
  const rejectedAmount = summary.REJECTED?.amount || 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Top Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm"
      >
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-600 uppercase tracking-wider mb-1">
            <ArrowDownCircle className="w-4 h-4" /> Financial Settlements
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Vendor Payouts & Withdrawals</h1>
          <p className="text-xs text-slate-500">
            Review and disburse withdrawal requests from marketplace vendors with automatic ledger reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadPayouts(statusFilter)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      {successMsg && (
        <motion.div
          variants={itemVariants}
          className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-2xl flex items-center gap-2 shadow-sm"
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span className="font-semibold">{successMsg}</span>
        </motion.div>
      )}

      {errorMsg && (
        <motion.div
          variants={itemVariants}
          className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2 shadow-sm"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span className="font-semibold">{errorMsg}</span>
        </motion.div>
      )}

      {/* Summary KPI Cards with Framer Motion hover elevation */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -3, transition: { duration: 0.18 } }}
          className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Pending Review</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{pendingCount}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">₹{pendingAmount.toLocaleString('en-IN')} queued</p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          whileHover={{ y: -3, transition: { duration: 0.18 } }}
          className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Total Disbursed</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 font-mono">₹{approvedAmount.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">{summary.APPROVED?.count || 0} approved settlements</p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          whileHover={{ y: -3, transition: { duration: 0.18 } }}
          className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Total Rejected</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 font-mono">₹{rejectedAmount.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">{summary.REJECTED?.count || 0} returned to balance</p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          whileHover={{ y: -3, transition: { duration: 0.18 } }}
          className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Payout Route</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base font-black text-slate-900">Direct Bank & UPI</p>
          <p className="text-xs text-slate-500 mt-1">Double-Entry Ledger sync</p>
        </motion.div>
      </motion.div>

      {/* Filter Tabs & Search */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm"
      >
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <Search className="w-3.5 h-3.5 text-blue-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search store, owner or email..."
            className="bg-transparent border-none text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-48 sm:w-60 font-medium"
          />
        </div>
      </motion.div>

      {/* Payouts Table */}
      <motion.div
        variants={itemVariants}
        className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-5">Vendor / Merchant</th>
                <th className="py-3.5 px-5">Amount</th>
                <th className="py-3.5 px-5">Store Balances</th>
                <th className="py-3.5 px-5">Payout Account</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 font-medium">
                    No payout requests found matching filter.
                  </td>
                </tr>
              ) : (
                filteredPayouts.map((p) => {
                  const vendor = p.vendorId;
                  const user = vendor?.userId;
                  const details = p.payoutDetails || {};

                  return (
                    <tr key={p._id} className="hover:bg-blue-50/40 transition">
                      <td className="py-4 px-5">
                        <div className="font-black text-slate-900 text-sm">{vendor?.storeName || 'Store'}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 font-medium">
                          <span>{user?.name || 'Owner'}</span>
                          <span>•</span>
                          <span>{user?.email || 'N/A'}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <span className="text-base font-black text-blue-600 font-mono">
                          ₹{p.amount?.toLocaleString('en-IN')}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-slate-700">
                        <div className="text-[11px]">
                          Available: <span className="font-mono text-emerald-600 font-bold">₹{vendor?.balance?.toLocaleString('en-IN') || 0}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Pending: <span className="font-mono text-amber-600 font-bold">₹{vendor?.pendingBalance?.toLocaleString('en-IN') || 0}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        {details.bankName ? (
                          <div className="text-[11px] text-slate-700 font-medium">
                            <span className="font-bold text-slate-900 block">{details.bankName}</span>
                            <span className="font-mono text-slate-500">A/C: {details.accountNumber}</span>
                            <span className="font-mono text-slate-400 block text-[10px]">IFSC: {details.ifscCode}</span>
                          </div>
                        ) : details.upiId ? (
                          <div className="text-[11px] text-slate-700 font-mono">
                            <span className="text-blue-600 font-bold">UPI:</span> {details.upiId}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Not provided</span>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full uppercase tracking-wider ${
                            p.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800 animate-pulse'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-slate-500 text-[11px]">
                        <div>{new Date(p.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{new Date(p.createdAt).toLocaleTimeString()}</div>
                      </td>

                      <td className="py-4 px-5 text-right">
                        {p.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setActionModal({ type: 'APPROVE', payout: p }); setAdminNotes(''); }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => { setActionModal({ type: 'REJECT', payout: p }); setAdminNotes(''); }}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {p.adminNotes || 'Completed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Animated Approve / Reject Modal */}
      <AnimatePresence>
        {actionModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setActionModal(null)}
                className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-base font-black text-slate-900 mb-1">
                {actionModal.type === 'APPROVE' ? 'Disburse Payout Settlement' : 'Reject Payout Request'}
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Store: <span className="text-blue-600 font-bold">{actionModal.payout.vendorId?.storeName}</span> • Amount:{' '}
                <span className="text-slate-900 font-black font-mono">₹{actionModal.payout.amount?.toLocaleString('en-IN')}</span>
              </p>

              <div className="space-y-4">
                {actionModal.type === 'APPROVE' ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800">
                    Approving this request will immediately record a <strong>PAYOUT</strong> debit on the Vendor Ledger and deduct from the vendor's pending balance.
                  </div>
                ) : (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800">
                    Rejecting this request will immediately restore the ₹{actionModal.payout.amount?.toLocaleString('en-IN')} back to the vendor's active balance.
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {actionModal.type === 'APPROVE' ? 'Payment Reference / Bank UTR' : 'Rejection Reason *'}
                  </label>
                  <textarea
                    rows="3"
                    required={actionModal.type === 'REJECT'}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder={
                      actionModal.type === 'APPROVE'
                        ? 'e.g. Bank UTR / NEFT reference number #12345678'
                        : 'Please specify reason (e.g. Bank details invalid or KYC mismatch)'
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActionModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  {actionModal.type === 'APPROVE' ? (
                    <button
                      type="button"
                      disabled={Boolean(processingId)}
                      onClick={handleApprove}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 transition"
                    >
                      Confirm & Disburse
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={Boolean(processingId) || !adminNotes.trim()}
                      onClick={handleReject}
                      className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-500/20 transition disabled:opacity-50"
                    >
                      Reject Request
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SuperAdminPayouts;
