import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AccountSidebar } from '../components/AccountSidebar';
import api from '../services/api';
import { ShieldCheck, User as UserIcon, Mail, Phone, Lock, CheckCircle, RefreshCw } from 'lucide-react';
import { fetchCurrentUser } from '../store/authSlice';
import { motion } from 'framer-motion';

export const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: '',
  });

  const [kycStatus, setKycStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await dispatch(fetchCurrentUser()).unwrap();
        
        const kycRes = await api.get('/shopkeeper/kyc').catch(() => ({ data: { data: null } }));
        if (kycRes.data?.data) {
          setKycStatus(kycRes.data.data.status);
        }
      } catch (err) {
        console.error('Failed to load profile details:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfileData();
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await api.put('/users/me', formData);
      if (response.data?.success) {
        setMessage('Profile updated successfully!');
        dispatch(fetchCurrentUser());
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const isKycApproved = kycStatus === 'APPROVED';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <AccountSidebar />
        
        <div className="flex-1 bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Profile Details</h1>
              <p className="text-xs text-slate-500 mt-1">Manage your identity, personal details and contact information</p>
            </div>
            {isKycApproved && (
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>KYC Verified</span>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-4 animate-pulse">
              <div className="h-12 bg-slate-100 rounded-2xl w-full"></div>
              <div className="h-12 bg-slate-100 rounded-2xl w-3/4"></div>
              <div className="h-12 bg-slate-100 rounded-2xl w-full"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Alert Banners */}
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold"
                >
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{message}</span>
                </motion.div>
              )}

              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-semibold">
                  {error}
                </div>
              )}

              {isKycApproved && (
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3.5 rounded-2xl text-xs leading-relaxed">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <span className="font-bold">Contact Lock Enabled:</span> Email and phone details are locked because you have an approved KYC record. Please contact administration to update verified credentials.
                  </div>
                </div>
              )}

              {/* Grid Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={isKycApproved}
                      placeholder="john@example.com"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs transition-colors ${
                        isKycApproved
                          ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-slate-50 border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white'
                      }`}
                    />
                    {isKycApproved && <Lock className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={isKycApproved}
                      placeholder="9876543210"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs transition-colors ${
                        isKycApproved
                          ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-slate-50 border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white'
                      }`}
                    />
                    {isKycApproved && <Lock className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Role (Read Only) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Account Role</label>
                  <input
                    type="text"
                    value={user?.role || 'CUSTOMER'}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 cursor-not-allowed uppercase"
                  />
                </div>

                {/* Referral Code (Read Only) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">My Referral Code</label>
                  <input
                    type="text"
                    value={user?.referralCode || 'N/A'}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-blue-700 cursor-not-allowed"
                  />
                </div>

              </div>

              {/* Submit Button */}
              <div className="flex justify-end border-t border-slate-100 pt-5 mt-6">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
                >
                  {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
