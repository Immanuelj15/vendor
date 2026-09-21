import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Coins,
  User,
  LogOut,
  Dices,
  Share2,
  Crown,
  Search,
  ChevronDown,
  Package,
  Heart,
  MapPin,
  Settings,
  X,
  Menu,
  ShoppingCart,
} from 'lucide-react';
import { logoutUser } from '../../store/authSlice';
import { NotificationMenu } from './NotificationMenu';
import { customerNavItems, customerProfileMenu } from '../../config/navigation';

export const CustomerNavbar = ({ onOpenMobileMenu }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const cartState = useSelector((state) => state.cart);
  const cartItemCount = cartState?.cart?.items?.length || 0;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [userMenuOpen]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await dispatch(logoutUser());
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
          
          {/* Left: Logo & Desktop Navigation */}
          <div className="flex items-center gap-6 lg:gap-8">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              aria-label="Open mobile menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  FairKart
                </span>
                <span className="text-[10px] block text-slate-400 font-bold tracking-wider uppercase -mt-1">
                  Shop • Earn • Refer
                </span>
              </div>
            </Link>

            {/* Desktop Navbar Links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs font-semibold text-slate-600 border-l border-slate-200 pl-6">
              {customerNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      isActive
                        ? 'text-blue-600 bg-blue-50 font-bold'
                        : item.highlight
                        ? 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${item.highlight ? 'text-blue-600' : ''}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Center: Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-xs lg:max-w-md items-center relative"
          >
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands, categories..."
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-blue-500 text-xs text-slate-800 rounded-xl pl-9 pr-8 py-2 transition-all outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Right: Actions (Cart, Notifications, Coins, Profile / Login) */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Coins Balance Pill (Authenticated Customer) */}
            {isAuthenticated && (
              <Link
                to="/account/wallet"
                title="Fair Coins Wallet"
                className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 hover:bg-amber-100/70 px-2.5 sm:px-3 py-1.5 rounded-full transition-all text-amber-800 shadow-xs shrink-0"
              >
                <Coins className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-xs font-black text-amber-700">
                  {Number(user?.fairCoinBalance ?? 0).toLocaleString()}
                </span>
                <span className="hidden sm:inline text-[10px] text-amber-600 font-semibold uppercase">
                  Coins
                </span>
              </Link>
            )}

            {/* Shopping Cart Button */}
            <Link
              to="/cart"
              title="Shopping Cart"
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white ring-2 ring-white">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Notifications Bell */}
            {isAuthenticated && <NotificationMenu portal="customer" />}

            {/* User Profile Dropdown or Login/Register */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2 rounded-xl hover:bg-slate-100 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[100px]">
                      {user?.name?.split(' ')[0] || 'User'}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200/90 shadow-2xl p-2 z-50 text-xs"
                    >
                      {/* User Summary Header */}
                      <div className="p-3 border-b border-slate-100 bg-slate-50/70 rounded-xl mb-1">
                        <p className="font-bold text-slate-900 truncate">{user?.name || 'Customer'}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                      </div>

                      {/* Dropdown Links */}
                      <div className="space-y-0.5 py-1">
                        {customerProfileMenu.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.name}
                              to={item.path}
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium transition"
                            >
                              <Icon className="w-4 h-4 text-slate-400" />
                              <span>{item.name}</span>
                            </Link>
                          );
                        })}
                      </div>

                      <div className="h-px bg-slate-100 my-1" />

                      {/* Logout Button */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 font-bold transition text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar Row (When on mobile) */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
            />
          </form>
        </div>
      </div>
    </header>
  );
};
