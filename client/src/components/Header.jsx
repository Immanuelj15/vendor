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
  ShieldCheck,
  Store,
  ShoppingCart,
  Bell,
  Check,
  Crown,
  Search,
  ChevronDown,
  Package,
  Menu,
  X,
  LayoutDashboard,
} from 'lucide-react';
import { logoutUser } from '../store/authSlice';
import { fetchNotifications, markAsRead, markAllAsRead } from '../store/notificationSlice';

export const Header = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const userMenuRef = useRef(null);

  const handleLogout = () => {
    setUserMenuOpen(false);
    setMobileOpen(false);
    dispatch(logoutUser());
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileOpen(false);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Account';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 shadow-xs transition-colors">
      <div className="max-w-[1580px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 md:gap-6">
          
          {/* Left: Brand Logo & Primary Nav */}
          <div className="flex items-center gap-6 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white"
              >
                <ShoppingBag className="w-5 h-5" />
              </motion.div>
              <div>
                <span className="font-black text-xl tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  FairKart
                </span>
                <span className="text-[10px] block text-slate-400 font-bold tracking-wider uppercase -mt-1">
                  Shop • Earn • Refer
                </span>
              </div>
            </Link>

            {/* Quick Links (Hidden on small tablets to prevent crowding) */}
            <nav className="hidden xl:flex items-center gap-5 text-xs font-semibold text-slate-600 border-l border-slate-200 pl-6">
              {isAuthenticated && (user?.role === 'CUSTOMER' || user?.role === 'USER') && (
                <Link
                  to="/customer/dashboard"
                  className="text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1.5 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200/60 font-bold"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
                  <span>Dashboard</span>
                </Link>
              )}
              <Link to="/products" className="hover:text-blue-600 transition-colors">
                Catalog
              </Link>
              <Link to="/account/subscription" className="text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-blue-600" />
                <span>VIP Pass</span>
              </Link>
              <Link to="/account/spin" className="hover:text-blue-600 transition-colors flex items-center gap-1">
                <Dices className="w-3.5 h-3.5 text-blue-500" />
                <span>Spin & Win</span>
              </Link>
              <Link to="/account/referrals" className="hover:text-blue-600 transition-colors flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5 text-blue-500" />
                <span>Referral Network</span>
              </Link>
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

          {/* Right: Actions, Badges & User Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Dashboard Quick Link Pill Based on Role */}
            {isAuthenticated && user?.role === 'SUPER_ADMIN' && (
              <Link
                to="/super-admin/dashboard"
                className="hidden sm:flex items-center gap-1.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full transition-all text-xs font-bold shadow-xs shrink-0"
              >
                <Crown className="w-3.5 h-3.5 text-blue-600" />
                <span>Super Admin</span>
              </Link>
            )}

            {isAuthenticated && user?.role === 'ADMIN' && (
              <Link
                to="/admin/dashboard"
                className="hidden sm:flex items-center gap-1.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full transition-all text-xs font-bold shadow-xs shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Admin Portal</span>
              </Link>
            )}

            {isAuthenticated && user?.role === 'VENDOR' && (
              <Link
                to="/vendor/dashboard"
                className="hidden sm:flex items-center gap-1.5 bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full transition-all text-xs font-bold shadow-xs shrink-0"
              >
                <Store className="w-3.5 h-3.5 text-purple-600" />
                <span>Vendor Portal</span>
              </Link>
            )}

            {isAuthenticated && (user?.role === 'CUSTOMER' || user?.role === 'USER') && (
              <Link
                to="/customer/dashboard"
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-full transition-all text-xs font-bold shadow-xs shrink-0 shadow-blue-500/20"
                title="Customer Dashboard"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            )}

            {/* Fair Coins Balance Badge */}
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

            {/* Cart Icon */}
            <Link
              to="/cart"
              title="Shopping Cart"
              className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 text-slate-600 hover:text-blue-600 transition-colors relative flex items-center justify-center shrink-0"
            >
              <ShoppingCart className="w-4 h-4" />
            </Link>

            {/* Notification Bell */}
            {isAuthenticated && <NotificationBell />}

            {/* User Profile Menu or Login/Register */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2 pr-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-blue-600 transition-all shadow-xs shrink-0"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden sm:inline text-xs font-bold text-slate-800 max-w-[90px] truncate">
                    {firstName}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      userMenuOpen ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>

                {/* Animated User Profile Dropdown */}
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 shadow-xl rounded-2xl z-50 p-2 text-xs overflow-hidden"
                    >
                      {/* User Info Header */}
                      <div className="p-3 bg-slate-50 rounded-xl mb-1 border border-slate-100">
                        <p className="font-bold text-slate-900 truncate">{user?.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                        <div className="mt-1.5">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                            {user?.role || 'CUSTOMER'}
                          </span>
                        </div>
                      </div>

                      {/* Role-Specific Portal Shortcut */}
                      <div className="space-y-0.5 py-1">
                        {user?.role === 'SUPER_ADMIN' && (
                          <Link
                            to="/super-admin/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-blue-700 bg-blue-50/70 hover:bg-blue-100 font-bold transition-colors"
                          >
                            <Crown className="w-4 h-4 text-blue-600" />
                            <span>Super Admin Control Center</span>
                          </Link>
                        )}

                        {user?.role === 'ADMIN' && (
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-blue-700 bg-blue-50/70 hover:bg-blue-100 font-bold transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                            <span>Admin Operations Portal</span>
                          </Link>
                        )}

                        {user?.role === 'VENDOR' && (
                          <Link
                            to="/vendor/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-blue-700 bg-blue-50/70 hover:bg-blue-100 font-bold transition-colors"
                          >
                            <Store className="w-4 h-4 text-blue-600" />
                            <span>Vendor Merchant Dashboard</span>
                          </Link>
                        )}

                        {(user?.role === 'USER' || user?.role === 'CUSTOMER') && (
                          <Link
                            to="/customer/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-blue-700 bg-blue-50/70 hover:bg-blue-100 font-bold transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4 text-blue-600" />
                            <span>Customer Dashboard</span>
                          </Link>
                        )}
                      </div>

                      <div className="h-px bg-slate-100 my-1" />

                      {/* Customer & General Account Links */}
                      <div className="space-y-0.5 py-1 text-slate-700">
                        <Link
                          to="/account/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 font-medium transition-colors"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          <span>My Account</span>
                        </Link>
                        <Link
                          to="/account/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 font-medium transition-colors"
                        >
                          <Package className="w-4 h-4 text-slate-400" />
                          <span>My Orders</span>
                        </Link>
                        <Link
                          to="/account/wallet"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 font-medium transition-colors"
                        >
                          <Coins className="w-4 h-4 text-amber-500" />
                          <span>Fair Coins Wallet</span>
                        </Link>
                        <Link
                          to="/account/referrals"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 font-medium transition-colors"
                        >
                          <Share2 className="w-4 h-4 text-blue-500" />
                          <span>Referral Network</span>
                        </Link>
                        <Link
                          to="/account/spin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 font-medium transition-colors"
                        >
                          <Dices className="w-4 h-4 text-blue-500" />
                          <span>Spin & Win</span>
                        </Link>
                      </div>

                      <div className="h-px bg-slate-100 my-1" />

                      {/* Logout Action */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
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
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
                >
                  Log In
                </Link>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/register"
                    className="px-4 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all block"
                  >
                    Register
                  </Link>
                </motion.div>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="xl:hidden p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="xl:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 overflow-hidden shadow-lg"
          >
            {/* Mobile Search */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands, categories..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              />
            </form>

            {/* Mobile Links */}
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700 pt-1">
              {isAuthenticated && (user?.role === 'CUSTOMER' || user?.role === 'USER') && (
                <Link
                  to="/customer/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="col-span-2 p-2.5 rounded-xl bg-blue-600 text-white font-bold transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to Customer Dashboard</span>
                </Link>
              )}
              {isAuthenticated && user?.role === 'VENDOR' && (
                <Link
                  to="/vendor/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="col-span-2 p-2.5 rounded-xl bg-purple-600 text-white font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Store className="w-4 h-4" />
                  <span>Go to Vendor Dashboard</span>
                </Link>
              )}
              {isAuthenticated && user?.role === 'ADMIN' && (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="col-span-2 p-2.5 rounded-xl bg-blue-700 text-white font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Go to Admin Portal</span>
                </Link>
              )}
              {isAuthenticated && user?.role === 'SUPER_ADMIN' && (
                <Link
                  to="/super-admin/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="col-span-2 p-2.5 rounded-xl bg-slate-900 text-white font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Go to Super Admin Console</span>
                </Link>
              )}

              <Link
                to="/products"
                onClick={() => setMobileOpen(false)}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <span>Product Catalog</span>
              </Link>
              <Link
                to="/account/subscription"
                onClick={() => setMobileOpen(false)}
                className="p-2.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-2"
              >
                <Crown className="w-4 h-4 text-blue-600" />
                <span>VIP Pass</span>
              </Link>
              <Link
                to="/account/spin"
                onClick={() => setMobileOpen(false)}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
              >
                <Dices className="w-4 h-4 text-blue-500" />
                <span>Spin & Win</span>
              </Link>
              <Link
                to="/account/referrals"
                onClick={() => setMobileOpen(false)}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
              >
                <Share2 className="w-4 h-4 text-blue-500" />
                <span>Referral Network</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

const NotificationBell = () => {
  const dispatch = useDispatch();
  const { list, unreadCount } = useSelector((state) => state.notifications);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    dispatch(fetchNotifications({ page: 1, limit: 5 }));

    // Poll every 30s as fallback
    const interval = setInterval(() => {
      dispatch(fetchNotifications({ page: 1, limit: 5 }));
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleMarkRead = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(markAsRead(id));
  };

  const handleMarkAllRead = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(markAllAsRead());
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 text-slate-600 hover:text-blue-600 transition-colors relative flex items-center justify-center shrink-0"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 shadow-xl rounded-2xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
              <span className="font-bold text-xs text-slate-800">Recent Alerts</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                >
                  <Check className="w-3 h-3" /> Mark read
                </button>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
              {list.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-slate-400">
                  No new notifications
                </div>
              ) : (
                list.slice(0, 5).map((item) => (
                  <div
                    key={item._id}
                    className={`px-4 py-3 hover:bg-blue-50/40 transition-colors flex gap-2.5 items-start ${
                      !item.isRead ? 'bg-blue-50/20' : 'opacity-70'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs break-words ${!item.isRead ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                        {item.title}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 break-words line-clamp-2">
                        {item.message}
                      </p>
                    </div>
                    {!item.isRead && (
                      <button
                        onClick={(e) => handleMarkRead(e, item._id)}
                        className="text-[9px] text-blue-600 hover:text-blue-700 font-bold shrink-0 self-center"
                      >
                        Read
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <Link
              to="/account/notifications"
              onClick={() => setIsOpen(false)}
              className="block text-center py-2.5 bg-slate-50 hover:bg-slate-100 border-t border-slate-100 text-[10px] font-bold text-slate-600 hover:text-blue-600 transition-all uppercase tracking-wider"
            >
              See all notifications
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Header;
