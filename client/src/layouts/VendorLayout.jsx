import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../store/authSlice';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ShoppingBag,
  Users,
  BadgePercent,
  QrCode,
  CreditCard,
  Network,
  Store,
  LogOut,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Bell
} from 'lucide-react';
import { motion } from 'framer-motion';

export const VendorLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/vendor/login');
  };

  const navGroups = [
    {
      group: 'Store Management',
      items: [
        { name: 'Dashboard', path: '/vendor/dashboard', icon: LayoutDashboard },
        { name: 'My Products', path: '/vendor/products', icon: Package },
        { name: 'Add Product', path: '/vendor/products/new', icon: PlusCircle },
        { name: 'Orders', path: '/vendor/orders', icon: ShoppingBag },
        { name: 'Customers', path: '/vendor/customers', icon: Users },
      ]
    },
    {
      group: 'Sales & Growth',
      items: [
        { name: 'Sales & Finance', path: '/vendor/finance', icon: TrendingUp },
        { name: 'Store QR Codes', path: '/vendor/qr', icon: QrCode },
        { name: 'Subscription Plans', path: '/vendor/subscription', icon: CreditCard },
        { name: 'Referral Network', path: '/vendor/network', icon: Network },
      ]
    },
    {
      group: 'Settings',
      items: [
        { name: 'Store Profile', path: '/vendor/profile', icon: Store },
      ]
    }
  ];

  const vendorStatus = user?.vendor?.status || 'APPROVED';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row">
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0">
        {/* Header Branding */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-black shadow-md shadow-blue-600/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">FairKart Merchant</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                  Vendor Portal
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Store Info Bar */}
        <div className="px-5 py-3 bg-blue-50/50 border-b border-blue-100/60 flex items-center justify-between">
          <div className="truncate">
            <p className="text-xs font-bold text-slate-800 truncate">{user?.vendor?.storeName || user?.name || 'My Store'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5" />
            {vendorStatus}
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
                  const isActive = location.pathname === item.path;
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
            <span>Sign Out Store</span>
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

export default VendorLayout;
