import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthError } from '../../store/authSlice';
import { Crown, Lock, Mail, ArrowRight, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export const SuperAdminLogin = () => {
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
      }
    }
  }, [isAuthenticated, user, navigate, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    const result = await dispatch(loginUser({ email, password, portal: 'SUPER_ADMIN' }));
    if (!result.error) {
      navigate('/super-admin/dashboard');
    }
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-100 via-blue-50/50 to-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md bg-white border border-slate-300/80 rounded-3xl p-8 shadow-2xl shadow-blue-900/10 relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 text-amber-400 border border-slate-800 mb-3 shadow-md">
            <Crown className="w-7 h-7 text-amber-400" />
          </div>
          <div className="inline-block px-3 py-0.5 rounded-full bg-slate-900 text-amber-400 text-[10px] font-black uppercase tracking-wider mb-2 border border-amber-400/20">
            Platform Owner Portal
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Platform Control Center</h2>
          <p className="text-xs text-slate-500 mt-1">Full platform authority, 9-level MLM settings, double-entry ledger & audit logs</p>
        </div>

        {/* Error Alert */}
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
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Super Admin Email</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@fairkart.dev"
                className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-4 py-2.5 pl-10 border border-slate-200 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Root Security Key / Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-4 py-2.5 pl-10 border border-slate-200 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Authorize & Enter Control Center</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-2.5 text-center">
          <p className="text-[11px] text-slate-400">
            Strict Root Security Enforced. Session activities are recorded in immutable audit logs.
          </p>
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 mt-2">
            <Link to="/customer/login" className="hover:text-blue-600 transition-colors">🛒 Customer</Link>
            <span>•</span>
            <Link to="/vendor/login" className="hover:text-blue-600 transition-colors">🏪 Vendor</Link>
            <span>•</span>
            <Link to="/admin/login" className="hover:text-blue-600 transition-colors">🛡️ Admin</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SuperAdminLogin;
