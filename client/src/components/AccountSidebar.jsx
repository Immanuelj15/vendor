import React from 'react';
import { NavLink } from 'react-router-dom';
import { User, ShoppingBag, MapPin, Bell, Share2, Coins, Dices, Settings, Heart, Percent, Crown, Receipt } from 'lucide-react';
import { useSelector } from 'react-redux';

export const AccountSidebar = () => {
  const { unreadCount } = useSelector((state) => state.notifications);

  const menuItems = [
    { name: 'My Profile', path: '/account/profile', icon: User },
    { name: 'My Orders', path: '/account/orders', icon: ShoppingBag },
    { name: 'VIP Membership', path: '/account/subscription', icon: Crown },
    { name: 'Offline Bills Rewards', path: '/account/offline-bills', icon: Receipt },
    { name: 'My Wishlist', path: '/account/wishlist', icon: Heart },
    { name: 'Address Book', path: '/account/addresses', icon: MapPin },
    {
      name: 'Notifications',
      path: '/account/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    { name: 'My Commissions', path: '/account/commissions', icon: Percent },
    { name: 'Referral Network', path: '/account/referrals', icon: Share2 },
    { name: 'Wallet & Coins', path: '/account/wallet', icon: Coins },
    { name: 'Spin & Win', path: '/account/spin', icon: Dices },
    { name: 'Account Settings', path: '/account/settings', icon: Settings },
  ];

  return (
    <aside className="w-full md:w-64 shrink-0">
      {/* Desktop Sidebar Card */}
      <div className="hidden md:block bg-white border border-slate-200/80 rounded-2xl p-4 sticky top-24 shadow-sm">
        <div className="mb-3 px-3 py-2 border-b border-slate-100 pb-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Portal</h2>
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50 border border-transparent'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge !== null && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Mobile Horizontal Navigation Slider */}
      <div className="md:hidden flex overflow-x-auto gap-2 pb-3 mb-4 scrollbar-none snap-x">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 snap-center transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white text-slate-700 border border-slate-200 shadow-xs'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.name}</span>
              {item.badge !== null && (
                <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
};

export default AccountSidebar;
