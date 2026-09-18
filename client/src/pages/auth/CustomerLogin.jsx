import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthError } from '../../store/authSlice';
import { ShoppingBag, Lock, Mail, ArrowRight, AlertCircle, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export const CustomerLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearAuthError());
    if (isAuthenticated && user) {
      if (user.role === 'USER' || user.role === 'CUSTOMER') {
        navigate('/customer/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    const result = await dispatch(loginUser({ email, password, portal: 'CUSTOMER' }));
    if (!result.error) {
      navigate('/customer/dashboard');
    }
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-blue-50/50 via-slate-50 to-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md bg-white border border-blue-100 rounded-3xl p-8 shadow-xl shadow-blue-500/5 relative overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/80 text-blue-600 border border-blue-200/60 mb-3 shadow-xs">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-blue-100/60 text-blue-700 text-[10px] font-black uppercase tracking-wider mb-2">
            Customer Portal
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome back, start shopping.</h2>
          <p className="text-xs text-slate-500 mt-1">Access your FairKart wallet, coins & reward spin wheel</p>
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
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-4 py-2.5 pl-10 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">Password</label>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Password reset instructions will be sent to your registered email.'); }} className="text-[11px] text-blue-600 hover:underline font-semibold">
                Forgot password?
              </a>
            </div>
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
                <span>Sign In to Shopping</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-2.5 text-center">
          <p className="text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/customer/register" className="text-blue-600 hover:underline font-bold">
              Register as Customer
            </Link>
          </p>
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 mt-2">
            <Link to="/vendor/login" className="hover:text-blue-600 transition-colors">🏪 Vendor Login</Link>
            <span>•</span>
            <Link to="/admin/login" className="hover:text-blue-600 transition-colors">🛡️ Admin Login</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CustomerLogin;
