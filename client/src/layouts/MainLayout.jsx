import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { CustomerNavbar } from '../components/navigation/CustomerNavbar';
import { CustomerMobileNav } from '../components/navigation/CustomerMobileNav';
import { Footer } from '../components/Footer';

export const MainLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 transition-colors pb-16 lg:pb-0">
      <CustomerNavbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CustomerMobileNav
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </div>
  );
};

export default MainLayout;
