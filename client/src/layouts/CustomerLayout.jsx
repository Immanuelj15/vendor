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

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 transition-colors pb-16 lg:pb-0">
      {/* 1. Top E-Commerce Navbar */}
      <CustomerNavbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

      {/* 2. Main Content Area with Generous Spacing */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* 3. Footer */}
      <Footer />

      {/* 4. Mobile Navigation (Bottom Nav + Secondary Drawer) */}
      <CustomerMobileNav
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </div>
  );
};

export default CustomerLayout;
