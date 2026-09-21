import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ShoppingBag } from 'lucide-react';
import { Footer } from '../components/Footer';
import { CustomerLayout } from './CustomerLayout';

export const MainLayout = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // If customer is authenticated, automatically provide the Customer Sidebar layout
  if (isAuthenticated && user?.role === 'CUSTOMER') {
    return <CustomerLayout />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between antialiased">
      {/* Public Minimal Header - Clean landing header, NOT an authenticated dashboard navbar */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md py-3.5 px-4 sm:px-8 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                FairKart
              </span>
              <span className="text-[10px] block text-slate-400 font-bold tracking-wider uppercase -mt-1">
                Shop • Earn • Refer
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/products"
              className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition"
            >
              Browse Catalog
            </Link>
            <Link
              to="/login"
              className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default MainLayout;
