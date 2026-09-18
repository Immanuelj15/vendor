import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../store/authSlice';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Wallet,
  Coins,
  Sparkles,
  FileText,
  CreditCard,
  Users,
  Heart,
  User,
  LogOut,
  ChevronRight,
  ShoppingCart
} from 'lucide-react';
import { motion } from 'framer-motion';

export const CustomerLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/customer/login');
  };

  const navGroups = [
    {
      group: 'My Account',
      items: [
        { name: 'Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
        { name: 'Browse Marketplace', path: '/products', icon: ShoppingBag },
        { name: 'My Orders', path: '/customer/orders', icon: Package },
        { name: 'My Cart', path: '/cart', icon: ShoppingCart },
        { name: 'Wishlist', path: '/customer/wishlist', icon: Heart },
      ]
    },
    {
      group: 'Coins & Rewards',
      items: [
        { name: 'Wallet & Ledger', path: '/customer/wallet', icon: Wallet },
        { name: 'Spin & Win Rewards', path: '/customer/spin', icon: Sparkles },
        { name: 'Upload Offline Bills', path: '/customer/offline-bills', icon: FileText },
        { name: 'Premium Subscription', path: '/customer/subscription', icon: CreditCard },
        { name: 'Referral Rewards', path: '/customer/referrals', icon: Users },
      ]
    },
    {
      group: 'Settings',
      items: [
        { name: 'Profile & Addresses', path: '/customer/profile', icon: User },
      ]
    }
  ];

  const fairCoins = user?.fairCoinBalance ?? 0;
  const superCoins = user?.superCoinBalance ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row">
      {/* Customer Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0">
        {/* Header Branding */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">FairKart</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  Customer Portal
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Customer Balance Snippet */}
        <div className="p-4 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 border-b border-blue-100/60 m-3 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">My Rewards</span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">ACTIVE</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-white/80 rounded-xl p-2 border border-blue-100/80">
              <div className="text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-1">
                <Coins className="w-3 h-3 text-amber-500" />
                Fair Coins
              </div>
              <div className="text-sm font-black text-slate-900 mt-0.5">{fairCoins}</div>
            </div>
            <div className="bg-white/80 rounded-xl p-2 border border-blue-100/80">
              <div className="text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-500" />
                Super Coins
              </div>
              <div className="text-sm font-black text-slate-900 mt-0.5">{superCoins}</div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto max-h-[calc(100vh-260px)]">
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
            <span>Sign Out</span>
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

export default CustomerLayout;
