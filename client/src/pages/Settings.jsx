import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AccountSidebar } from '../components/AccountSidebar';
import api from '../services/api';
import { Settings as SettingsIcon, Lock, KeyRound, CheckCircle, RefreshCw, Bell } from 'lucide-react';
import { fetchCurrentUser } from '../store/authSlice';
import { motion } from 'framer-motion';

export const Settings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [preferences, setPreferences] = useState({
    orderUpdates: user?.notificationPreferences?.orderUpdates ?? true,
    walletAlerts: user?.notificationPreferences?.walletAlerts ?? true,
    securityAlerts: user?.notificationPreferences?.securityAlerts ?? true,
    promotional: user?.notificationPreferences?.promotional ?? false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [prefLoading, setPrefLoading] = useState(false);
  const [prefMessage, setPrefMessage] = useState(null);
  const [prefError, setPrefError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePrefChange = (e) => {
    setPreferences({ ...preferences, [e.target.name]: e.target.checked });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.put('/users/me/password', {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });

      if (res.data?.success) {
        setMessage('Password updated successfully!');
        setFormData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrefSubmit = async (e) => {
    e.preventDefault();
    setPrefLoading(true);
    setPrefMessage(null);
    setPrefError(null);

    try {
      const res = await api.put('/users/me', {
        notificationPreferences: preferences
      });

      if (res.data?.success) {
        setPrefMessage('Preferences updated successfully!');
        dispatch(fetchCurrentUser());
      }
    } catch (err) {
      setPrefError(err.response?.data?.message || 'Failed to update preferences');
    } finally {
      setPrefLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <AccountSidebar />

        <div className="flex-1 bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-xs space-y-8">
          
          {/* Main Title */}
          <div className="border-b border-slate-100 pb-5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <SettingsIcon className="w-6 h-6 text-blue-600" />
              <span>Account Security & Preferences</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">Manage login credentials, password security, and notification channels</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
            
            {/* Card 1: Change Password */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-6 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  <span>Change Password</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Ensure your account uses a strong, random password</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold"
                  >
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{message}</span>
                  </motion.div>
                )}

                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded-xl text-xs font-semibold">
                    {error}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Current Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      name="oldPassword"
                      value={formData.oldPassword}
                      onChange={handleChange}
                      required
                      placeholder="Enter your current password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      required
                      placeholder="Min 6 characters"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="Re-enter new password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
                  >
                    {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Card 2: Notification Preferences */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-6 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span>Notification Preferences</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Control which email and app notifications you receive</p>
              </div>
              
              <form onSubmit={handlePrefSubmit} className="space-y-4">
                {prefMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold"
                  >
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{prefMessage}</span>
                  </motion.div>
                )}

                {prefError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded-xl text-xs font-semibold">
                    {prefError}
                  </div>
                )}

                <div className="space-y-3">
                  
                  {/* Order Updates */}
                  <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-white border border-slate-200">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900">Order Updates</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">Notifications on purchases, shipping, and delivery transitions.</p>
                    </div>
                    <input
                      type="checkbox"
                      name="orderUpdates"
                      checked={preferences.orderUpdates}
                      onChange={handlePrefChange}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-1 cursor-pointer"
                    />
                  </div>

                  {/* Wallet Alerts */}
                  <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-white border border-slate-200">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900">Wallet & Fair Coins</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">Receive alerts when coins are credited, debited, or earned.</p>
                    </div>
                    <input
                      type="checkbox"
                      name="walletAlerts"
                      checked={preferences.walletAlerts}
                      onChange={handlePrefChange}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-1 cursor-pointer"
                    />
                  </div>

                  {/* Security Alerts */}
                  <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-white border border-slate-200">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900">Security Alerts</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">Important notices for verification, KYC, and credential updates.</p>
                    </div>
                    <input
                      type="checkbox"
                      name="securityAlerts"
                      checked={preferences.securityAlerts}
                      onChange={handlePrefChange}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-1 cursor-pointer"
                    />
                  </div>

                  {/* Promotional Messages */}
                  <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-white border border-slate-200">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900">Promotions & Deals</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">Exclusive coupon drops, flash sales, and bonus rewards.</p>
                    </div>
                    <input
                      type="checkbox"
                      name="promotional"
                      checked={preferences.promotional}
                      onChange={handlePrefChange}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-1 cursor-pointer"
                    />
                  </div>

                </div>

                <div className="flex justify-end pt-2 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={prefLoading}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
                  >
                    {prefLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Preferences</span>
                  </button>
                </div>
              </form>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;
