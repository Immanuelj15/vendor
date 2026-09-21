import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Store, Shield, Crown } from 'lucide-react';

export const AuthLayoutWrapper = () => {
  const location = useLocation();
  const pathname = location.pathname;

  // Determine portal context from pathname
  let portalInfo = {
    title: 'FairKart',
    tagline: 'Next-Gen Multi-Vendor Marketplace',
    icon: ShoppingBag,
    gradient: 'from-blue-600 to-indigo-700',
    homeLink: '/',
  };

  if (pathname.includes('/super-admin')) {
    portalInfo = {
      title: 'FairKart Super Admin',
      tagline: 'Platform Command Center & Privileged Access',
      icon: Crown,
      gradient: 'from-slate-900 to-indigo-950',
      homeLink: '/super-admin/login',
    };
  } else if (pathname.includes('/admin')) {
    portalInfo = {
      title: 'FairKart Admin',
      tagline: 'Operations & Management Portal',
      icon: Shield,
      gradient: 'from-blue-700 to-slate-900',
      homeLink: '/admin/login',
    };
  } else if (pathname.includes('/vendor')) {
    portalInfo = {
      title: 'FairKart Merchant',
      tagline: 'Vendor Business Portal & Store Operations',
      icon: Store,
      gradient: 'from-blue-600 to-indigo-700',
      homeLink: '/vendor/login',
    };
  }

  const Icon = portalInfo.icon;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800 antialiased relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern radial-fade-mask opacity-70 pointer-events-none" />

      {/* 1. Minimal Header */}
      <header className="relative z-10 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md py-3 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to={portalInfo.homeLink} className="flex items-center gap-2.5 group">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${portalInfo.gradient} text-white flex items-center justify-center font-black shadow-md shadow-blue-500/10 group-hover:scale-105 transition-transform`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-slate-900">
                {portalInfo.title}
              </span>
              <span className="text-[10px] block text-slate-400 font-bold tracking-wider uppercase -mt-0.5">
                {portalInfo.tagline}
              </span>
            </div>
          </Link>

          {/* Quick Support / Portal Switch Link */}
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
            <Link to="/portals" className="hover:text-blue-600 transition">
              All Portals
            </Link>
            <span className="text-slate-300">•</span>
            <Link to="/" className="hover:text-blue-600 transition">
              Marketplace
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Main Centered Auth Card Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-8 px-4 sm:px-6">
        <Outlet />
      </main>

      {/* 3. Minimal Footer */}
      <footer className="relative z-10 w-full border-t border-slate-200/80 bg-white/70 py-4 px-4 sm:px-8 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} FairKart Platform. Encrypted & Secure Authentication.</p>
          <div className="flex items-center gap-4 text-[11px] font-medium text-slate-400">
            <Link to="/" className="hover:text-slate-600 transition">Terms</Link>
            <Link to="/" className="hover:text-slate-600 transition">Privacy Policy</Link>
            <Link to="/" className="hover:text-slate-600 transition">Security Disclosure</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
