import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogOut, ShoppingBag, Crown } from 'lucide-react';
import { logoutUser } from '../../store/authSlice';
import {
  customerMobileBottomNav,
  customerDrawerSecondaryItems,
} from '../../config/navigation';

export const CustomerMobileNav = ({ isOpen, onClose }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Close drawer on route change
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleLogout = async () => {
    onClose();
    await dispatch(logoutUser());
    navigate('/');
  };

  return (
    <>
      {/* 1. Fixed Bottom Navigation Bar (Thumb-reach for mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1 safe-area-pb">
        <div className="flex items-center justify-around">
          {customerMobileBottomNav.map((item) => {
            const Icon = item.icon;
            // Check active state
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                  isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* 2. Slide-out Secondary Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            />

            {/* Drawer Content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">FairKart</h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Menu & Explore</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile Card / Login Prompt */}
              {isAuthenticated ? (
                <div className="p-4 border-b border-slate-100 bg-blue-50/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate">{user?.name || 'Customer'}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-b border-slate-100 bg-blue-50/40 flex items-center gap-2">
                  <Link
                    to="/login"
                    onClick={onClose}
                    className="flex-1 py-2 text-center rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={onClose}
                    className="flex-1 py-2 text-center rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-xs"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Navigation Items */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                <div className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Explore FairKart
                </div>
                {customerDrawerSecondaryItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Drawer Footer with Logout if Authenticated */}
              {isAuthenticated && (
                <div className="p-3 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
