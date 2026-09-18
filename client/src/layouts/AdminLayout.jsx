import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../store/authSlice';
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  ShoppingBag,
  Package,
  CreditCard,
  Banknote,
  Percent,
  BarChart3,
  Bell,
  User,
  LogOut,
  ChevronRight,
  Shield,
  Layers,
  FileCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/admin/login');
  };

  const navGroups = [
    {
      group: 'Core Operations',
      items: [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Vendors', path: '/admin/vendors', icon: ShieldCheck },
        { name: 'Customers', path: '/admin/users', icon: Users },
        { name: 'Orders', path: '/admin/orders', icon: Package },
        { name: 'Products', path: '/admin/products', icon: ShoppingBag },
      ]
    },
    {
      group: 'Financials & Payouts',
      items: [
        { name: 'Subscriptions', path: '/admin/subscriptions', icon: Layers },
        { name: 'Payments', path: '/admin/payments', icon: CreditCard },
        { name: 'Payout Requests', path: '/admin/settlements', icon: Banknote },
        { name: 'Commissions', path: '/admin/commissions', icon: Percent },
        { name: 'KYC Reviews', path: '/admin/kyc', icon: FileCheck },
      ]
    },
    {
      group: 'Insights & System',
      items: [
        { name: 'Reports & Analytics', path: '/admin/analytics', icon: BarChart3 },
        { name: 'Notifications', path: '/admin/notifications', icon: Bell },
        { name: 'Admin Profile', path: '/account/profile', icon: User },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row">
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0">
        {/* Header Branding */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">FairKart Operations</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  Admin Portal
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* User Info Bar */}
        <div className="px-5 py-3 bg-blue-50/50 border-b border-blue-100/60 flex items-center justify-between">
          <div className="truncate">
            <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Administrator'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-wider">
            {user?.role || 'ADMIN'}
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto max-h-[calc(100vh-180px)]">
          {navGroups.map((group) => (
            <div key={group.group}>
              <div className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                {group.group}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-bold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.name}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout Footer */}
        <div className="p-3 border-t border-slate-100 bg-white">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-h-screen">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
};

export default AdminLayout;
