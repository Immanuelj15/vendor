import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AccountSidebar } from '../components/AccountSidebar';
import api from '../services/api';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  PlusCircle,
  Building,
  Calendar,
  DollarSign,
  Coins,
  Loader2,
  ExternalLink,
  ChevronRight,
  Receipt,
  Sparkles,
  Award,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OfflineBills = () => {
  const { user } = useSelector((state) => state.auth);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');

  // Form State
  const [formData, setFormData] = useState({
    storeName: '',
    billNumber: '',
    billDate: new Date().toISOString().split('T')[0],
    purchaseAmount: '',
    storePhone: '',
    storeAddress: '',
    fileUrl: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customer/offline-bills/my-bills');
      if (res.data?.success) {
        setBills(res.data.data.bills || []);
      }
    } catch (err) {
      console.error('Failed to fetch offline bills:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      setFormData((prev) => ({ ...prev, fileUrl: result }));
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.storeName.trim()) {
      setErrorMsg('Please enter the store name.');
      return;
    }
    if (!formData.billNumber.trim()) {
      setErrorMsg('Please enter the bill/invoice number.');
      return;
    }
    if (!formData.purchaseAmount || Number(formData.purchaseAmount) <= 0) {
      setErrorMsg('Please enter a valid purchase amount in ₹.');
      return;
    }
    if (!formData.fileUrl) {
      setErrorMsg('Please upload a clear photo or copy of your bill.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/customer/offline-bills/submit', {
        storeName: formData.storeName.trim(),
        billNumber: formData.billNumber.trim(),
        billDate: formData.billDate,
        purchaseAmount: Number(formData.purchaseAmount),
        storePhone: formData.storePhone.trim() || undefined,
        storeAddress: formData.storeAddress.trim() || undefined,
        fileUrl: formData.fileUrl,
      });

      setSuccessMsg('Your offline bill has been submitted successfully for verification!');
      setFormData({
        storeName: '',
        billNumber: '',
        billDate: new Date().toISOString().split('T')[0],
        purchaseAmount: '',
        storePhone: '',
        storeAddress: '',
        fileUrl: '',
      });
      setPreviewUrl('');
      setShowSubmitModal(false);
      fetchBills();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit offline bill. Please check the details.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBills = bills.filter((b) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'SUBMITTED') return b.status === 'SUBMITTED' || b.status === 'UNDER_REVIEW';
    if (activeTab === 'APPROVED') return b.status === 'APPROVED';
    if (activeTab === 'REJECTED') return b.status === 'REJECTED';
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Approved & Rewarded
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Under Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      case 'SUBMITTED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <AccountSidebar />

        <main className="flex-1 space-y-6">
          {/* Top Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-6 sm:p-8 shadow-xl shadow-blue-600/10">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Offline Partner Stores</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Offline Bill Rewards
                </h1>
                <p className="text-xs sm:text-sm text-blue-100">
                  Shop offline at any verified partner store, upload your purchase receipt, and earn cashback Super Coins!
                </p>
              </div>

              <button
                onClick={() => {
                  setErrorMsg('');
                  setSuccessMsg('');
                  setShowSubmitModal(true);
                }}
                className="shrink-0 inline-flex items-center justify-center gap-2 bg-white text-blue-700 hover:bg-blue-50 font-bold px-5 py-3 rounded-xl shadow-md transition-all cursor-pointer text-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Upload New Bill</span>
              </button>
            </div>
          </div>

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-3"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* Reward Rule Explainer Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Step 1</div>
                <div className="text-sm font-black text-slate-900 mt-0.5">Physical Receipt</div>
                <div className="text-xs text-slate-500 mt-1">Valid for store bills up to 30 days old</div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Step 2</div>
                <div className="text-sm font-black text-slate-900 mt-0.5">Upload Details</div>
                <div className="text-xs text-slate-500 mt-1">Admin review within 24-48 hours</div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Step 3</div>
                <div className="text-sm font-black text-slate-900 mt-0.5">Earn Super Coins</div>
                <div className="text-xs text-slate-500 mt-1">Redeemable on marketplace orders</div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            {[
              { id: 'ALL', label: 'All Bills', count: bills.length },
              {
                id: 'SUBMITTED',
                label: 'In Review',
                count: bills.filter((b) => b.status === 'SUBMITTED' || b.status === 'UNDER_REVIEW').length,
              },
              {
                id: 'APPROVED',
                label: 'Approved',
                count: bills.filter((b) => b.status === 'APPROVED').length,
              },
              {
                id: 'REJECTED',
                label: 'Rejected',
                count: bills.filter((b) => b.status === 'REJECTED').length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Bills List */}
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs font-semibold">Loading your submitted bills...</p>
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200/80 rounded-3xl shadow-xs space-y-4">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-slate-900">No bills found in this category</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  {activeTab === 'ALL'
                    ? "You haven't submitted any offline bills yet. Upload your first bill receipt now to start earning rewards!"
                    : `No bills with status "${activeTab}" found.`}
                </p>
              </div>
              {activeTab === 'ALL' && (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Upload First Bill</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBills.map((bill) => (
                <motion.div
                  key={bill._id}
                  whileHover={{ y: -2 }}
                  className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-blue-600" />
                        <h3 className="text-sm font-black text-slate-900">{bill.storeName}</h3>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>Bill #{bill.billNumber}</span>
                        <span>•</span>
                        <span>{new Date(bill.billDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <div>{getStatusBadge(bill.status)}</div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Purchase Amount</div>
                      <div className="text-lg font-black text-slate-900 mt-0.5">
                        ₹{bill.purchaseAmount?.toLocaleString('en-IN')}
                      </div>
                    </div>
                    {bill.status === 'APPROVED' && (
                      <div className="text-right">
                        <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Reward Credited</div>
                        <div className="text-xs font-black text-amber-600 flex items-center gap-1 justify-end mt-0.5">
                          <Coins className="w-3.5 h-3.5 text-amber-500" />
                          <span>Super Coins Earned</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {bill.rejectionReason && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Rejection Reason: </span>
                        <span>{bill.rejectionReason}</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <div className="text-[11px]">
                      Submitted on {new Date(bill.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                    {bill.fileUrl && (
                      <a
                        href={bill.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold text-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Attached Bill</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Bill Upload Modal */}
          <AnimatePresence>
            {showSubmitModal && (
              <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative my-8"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-slate-900">Upload Offline Store Bill</h2>
                        <p className="text-xs text-slate-500">Provide purchase details and attach receipt photo</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowSubmitModal(false)}
                      className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {errorMsg && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Store / Shop Name *
                        </label>
                        <input
                          type="text"
                          name="storeName"
                          value={formData.storeName}
                          onChange={handleInputChange}
                          placeholder="e.g. Babu Super Market"
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Bill / Invoice Number *
                        </label>
                        <input
                          type="text"
                          name="billNumber"
                          value={formData.billNumber}
                          onChange={handleInputChange}
                          placeholder="e.g. INV-98721"
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Purchase Amount (₹) *
                        </label>
                        <input
                          type="number"
                          name="purchaseAmount"
                          min="1"
                          step="0.01"
                          value={formData.purchaseAmount}
                          onChange={handleInputChange}
                          placeholder="e.g. 1450"
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Bill Date *
                        </label>
                        <input
                          type="date"
                          name="billDate"
                          max={new Date().toISOString().split('T')[0]}
                          value={formData.billDate}
                          onChange={handleInputChange}
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Store Contact Phone (Optional)
                        </label>
                        <input
                          type="text"
                          name="storePhone"
                          value={formData.storePhone}
                          onChange={handleInputChange}
                          placeholder="e.g. 9876543210"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Store Address / Area (Optional)
                        </label>
                        <input
                          type="text"
                          name="storeAddress"
                          value={formData.storeAddress}
                          onChange={handleInputChange}
                          placeholder="e.g. Indiranagar, Bengaluru"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    {/* Bill File Upload */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Bill Image / PDF Receipt *
                      </label>
                      <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-4 text-center bg-slate-50 transition">
                        {previewUrl ? (
                          <div className="space-y-3">
                            <img
                              src={previewUrl}
                              alt="Bill Preview"
                              className="max-h-48 mx-auto rounded-xl object-contain border border-slate-200 bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, fileUrl: '' }));
                                setPreviewUrl('');
                              }}
                              className="text-xs text-rose-600 hover:text-rose-700 underline font-bold"
                            >
                              Remove & Upload Different File
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer block space-y-2 py-4">
                            <UploadCloud className="w-8 h-8 text-blue-600 mx-auto" />
                            <div className="text-xs font-bold text-slate-800">Click to select bill photo / PDF</div>
                            <div className="text-[11px] text-slate-400">Supports JPG, PNG, PDF up to 5MB</div>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Submission buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowSubmitModal(false)}
                        disabled={submitting}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Submit for Review</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default OfflineBills;
