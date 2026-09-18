import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Shield,
  BarChart3,
  FileText,
  Settings,
  User,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Crown,
  KeyRound,
  Network,
  Percent,
  CreditCard,
  ArrowDownCircle,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { logoutUser } from '../store/authSlice';

export const SuperAdminLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/super-admin/dashboard', icon: LayoutDashboard },
    { name: '9-Level MLM Tree', path: '/super-admin/mlm', icon: Network },
    { name: 'Commission Rules', path: '/super-admin/commissions', icon: Percent },
    { name: 'Subscription Plans', path: '/super-admin/subscriptions', icon: CreditCard },
    { name: 'Vendor Payouts', path: '/super-admin/payouts', icon: ArrowDownCircle },
    { name: 'Financial Ledger', path: '/super-admin/ledger', icon: Receipt },
    { name: 'User Management', path: '/super-admin/users', icon: Users },
    { name: 'Admin Management', path: '/super-admin/admins', icon: ShieldCheck },
    { name: 'Roles & Permissions', path: '/super-admin/roles', icon: KeyRound },
    { name: 'Analytics & Trends', path: '/super-admin/analytics', icon: BarChart3 },
    { name: 'Audit Logs', path: '/super-admin/audit-logs', icon: FileText },
    { name: 'System Settings', path: '/super-admin/settings', icon: Settings },
    { name: 'My Profile', path: '/super-admin/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row antialiased">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-wide text-slate-900">FairKart</span>
            <span className="ml-1.5 text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-1.5 py-0.5 rounded">Super Admin</span>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:flex flex-col w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0 z-30 shadow-sm`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 hidden md:flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-slate-900">
                  FairKart
                </span>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/60 uppercase">
                  HQ
                </span>
              </div>
              <p className="text-[11px] text-blue-600 font-semibold tracking-tight">Super Admin Command Center</p>
            </div>
          </div>
        </div>

        {/* User Quick Info */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20">
              {user?.name?.charAt(0) || 'S'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Super Admin'}</p>
              <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 font-bold uppercase bg-blue-100/70 px-2 py-0.5 rounded-full mt-0.5">
                <Shield className="w-2.5 h-2.5" /> SUPER_ADMIN
              </span>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <motion.div
                key={item.name}
                whileHover={{ x: 3 }}
                transition={{ duration: 0.15 }}
              >
                <Link
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 font-bold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-600" />}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Logout Action */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area with Animated Page Transitions */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default SuperAdminLayout;
