import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard,
  Package,
  Wallet,
  Sparkles,
  Heart,
  User,
  Share2,
  FileText,
  CreditCard,
} from 'lucide-react';
import { CustomerNavbar } from '../components/navigation/CustomerNavbar';
import { CustomerMobileNav } from '../components/navigation/CustomerMobileNav';
import { Footer } from '../components/Footer';

export const CustomerLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // Quick sub-navigation for customer account pages
  const isAccountRoute =
    location.pathname.startsWith('/customer') ||
    location.pathname.startsWith('/account');

  const subNavLinks = [
    { name: 'Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
    { name: 'Orders', path: '/customer/orders', icon: Package },
    { name: 'Wallet & Coins', path: '/customer/wallet', icon: Wallet },
    { name: 'Wishlist', path: '/customer/wishlist', icon: Heart },
    { name: 'Spin & Win', path: '/customer/spin', icon: Sparkles },
    { name: 'Referrals', path: '/customer/referrals', icon: Share2 },
    { name: 'Profile', path: '/customer/profile', icon: User },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 transition-colors pb-16 lg:pb-0">
      {/* 1. Top E-Commerce Navbar */}
      <CustomerNavbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

      {/* 2. Optional Account Sub-Navigation Bar (Desktop/Tablet) */}
      {isAccountRoute && isAuthenticated && (
        <div className="bg-white border-b border-slate-200/80 sticky top-16 z-20 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 text-xs font-semibold">
              {subNavLinks.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/customer/dashboard' &&
                    location.pathname.startsWith(item.path));

                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Body */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* 4. Footer */}
      <Footer />

      {/* 5. Mobile Navigation (Bottom Nav + Secondary Drawer) */}
      <CustomerMobileNav
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </div>
  );
};

export default CustomerLayout;
