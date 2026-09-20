import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthError } from '../store/authSlice';
import {
  ShoppingBag,
  Store,
  Shield,
  Crown,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';

export const PortalGateway = () => {
  const [activePortal, setActivePortal] = useState('CUSTOMER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearAuthError());
    if (isAuthenticated && user) {
      if (user.role === 'SUPER_ADMIN') {
        navigate('/super-admin/dashboard');
      } else if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'VENDOR') {
        navigate('/vendor/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate, dispatch]);

  const portals = [
    { id: 'CUSTOMER', label: 'Customer', icon: ShoppingBag, desc: 'Shopping & Rewards', path: '/login' },
    { id: 'VENDOR', label: 'Vendor', icon: Store, desc: 'Store & Products', path: '/vendor/login' },
    { id: 'ADMIN', label: 'Admin', icon: Shield, desc: 'Operations & Approvals', path: '/admin/login' },
    { id: 'SUPER_ADMIN', label: 'Super Admin', icon: Crown, desc: 'Platform Owner', path: '/super-admin/login' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    const result = await dispatch(loginUser({ email, password, portal: activePortal }));
    if (!result.error) {
      const u = result.payload.user;
      if (u?.role === 'SUPER_ADMIN') navigate('/super-admin/dashboard');
      else if (u?.role === 'ADMIN') navigate('/admin/dashboard');
      else if (u?.role === 'VENDOR') navigate('/vendor/dashboard');
      else navigate('/customer/dashboard');
    }
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-blue-50/50 via-slate-50 to-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Portal Selector Tabs */}
        <div className="text-center mb-6">
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider mb-2">
            Internal Operations Gateway
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">FairKart Portals</h2>
          <p className="text-xs text-slate-500 mt-1">Select your designated portal to sign in or navigate to direct portal URLs</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {portals.map((p) => {
            const Icon = p.icon;
            const isSelected = activePortal === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setActivePortal(p.id);
                  dispatch(clearAuthError());
                }}
                className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col items-center text-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-bold leading-tight">{p.label}</div>
                  <div className={`text-[9px] mt-0.5 leading-tight ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                    {p.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs font-medium"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {activePortal === 'VENDOR'
                ? 'Vendor Business Email'
                : activePortal === 'ADMIN'
                ? 'Admin Account Email'
                : activePortal === 'SUPER_ADMIN'
                ? 'Super Admin Email'
                : 'Customer Email'}
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-4 py-2.5 pl-10 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-4 py-2.5 pl-10 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Sign In to {portals.find((p) => p.id === activePortal)?.label}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-2 text-center text-xs text-slate-500">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Direct Portal URL:</span>
            <Link
              to={portals.find((p) => p.id === activePortal)?.path || '/login'}
              className="text-blue-600 hover:underline font-bold flex items-center gap-1"
            >
              <span>Go to {portals.find((p) => p.id === activePortal)?.label} Login Page</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PortalGateway;
