import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  ChevronRight,
  ChevronDown,
  User,
  LogOut,
  ShieldCheck,
  Lock,
  Store,
  Crown,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { NotificationMenu } from './NotificationMenu';

export const PortalTopbar = ({
  portal = 'vendor', // 'vendor' | 'admin' | 'super-admin'
  user,
  profileMenu = [],
  onOpenMobile,
  onLogout,
}) => {
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [profileOpen]);

  // Compute breadcrumbs from path
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathParts.map((part, index) => {
    const path = `/${pathParts.slice(0, index + 1).join('/')}`;
    const name = part
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return { name, path, isLast: index === pathParts.length - 1 };
  });

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 shadow-xs">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Menu Button */}
          <button
            onClick={onOpenMobile}
            className="lg:hidden p-2 -ml-1 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            aria-label="Toggle Navigation Drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb Trail */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto no-scrollbar py-0.5" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.path}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                {crumb.isLast ? (
                  <span className="font-bold text-slate-900 truncate" aria-current="page">
                    {crumb.name}
                  </span>
                ) : (
                  <Link
                    to={crumb.path}
                    className="hover:text-blue-600 transition truncate hidden sm:inline"
                  >
                    {crumb.name}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Right: Security/Status Indicators & Profile Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Super Admin Privileged Security Status */}
          {portal === 'super-admin' && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200/80 rounded-full text-[11px] font-bold text-indigo-700 shadow-2xs">
              <Lock className="w-3 h-3 text-indigo-600" />
              <span>Privileged Session</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
            </div>
          )}

          {/* Vendor Active Store Status */}
          {portal === 'vendor' && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full text-[11px] font-bold text-emerald-800 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{user?.vendor?.storeName || 'Store Verified'}</span>
            </div>
          )}

          {/* Notifications */}
          <NotificationMenu portal={portal} />

          {/* Role Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition text-left"
              aria-expanded={profileOpen}
              aria-label="User Profile Menu"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs text-white ${
                portal === 'super-admin'
                  ? 'bg-gradient-to-tr from-slate-900 to-indigo-700'
                  : portal === 'admin'
                  ? 'bg-blue-700'
                  : 'bg-blue-600'
              }`}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                  {user?.name || 'Administrator'}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase leading-tight">
                  {user?.role || portal}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-slate-200/90 shadow-2xl p-2 z-50 text-xs"
                >
                  <div className="p-3 border-b border-slate-100 bg-slate-50/70 rounded-xl mb-1">
                    <p className="font-bold text-slate-900 truncate">{user?.name || 'Authorized Account'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-black rounded-full uppercase tracking-wider">
                      Role: {user?.role || portal}
                    </span>
                  </div>

                  <div className="space-y-0.5 py-1">
                    {profileMenu.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.path}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium transition"
                        >
                          <Icon className="w-4 h-4 text-slate-400" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="h-px bg-slate-100 my-1" />

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 font-bold transition text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};
