import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  Shield,
  Crown,
  Store,
  ShoppingBag,
  Settings,
} from 'lucide-react';

export const PortalSidebar = ({
  portal = 'vendor', // 'customer' | 'vendor' | 'admin' | 'super-admin'
  title = 'Vendor Portal',
  subtitle = 'Store Operations',
  navGroups = [],
  isCollapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
  onLogout,
  user,
}) => {
  const location = useLocation();
  const cartItemCount = useSelector((state) => state.cart?.cart?.items?.length) || 0;

  // Escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileOpen) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  // Close mobile drawer on route or tab change
  useEffect(() => {
    onCloseMobile();
  }, [location.pathname, location.search]);

  // Robust active link resolution that distinguishes query parameters and tabs
  const isItemActive = (itemPath) => {
    if (!itemPath) return false;

    const [itemBase, itemQuery] = itemPath.split('?');
    const currentPath = location.pathname;
    const currentSearch = location.search ? location.search.replace(/^\?/, '') : '';
    const currentParams = new URLSearchParams(currentSearch);

    // 1. If this nav item requires a query parameter (e.g. ?tab=tracking, ?tab=returns)
    if (itemQuery) {
      if (currentPath !== itemBase) return false;
      const itemParams = new URLSearchParams(itemQuery);
      for (const [key, val] of itemParams.entries()) {
        if (currentParams.get(key) !== val) return false;
      }
      return true;
    }

    // 2. If the current URL has a tab or view query parameter, an item without query param should not match
    if (currentParams.has('tab') || currentParams.has('view')) {
      return false;
    }

    // 3. Exact path match
    if (currentPath === itemBase) {
      return true;
    }

    // 4. Sub-route match (e.g., /customer/orders/:id matches /customer/orders)
    // Exclude root and main dashboards from matching everything
    if (
      itemBase !== '/' &&
      itemBase !== `/${portal}` &&
      itemBase !== `/${portal}/dashboard` &&
      currentPath.startsWith(`${itemBase}/`)
    ) {
      return true;
    }

    return false;
  };

  // Determine portal branding colors & icon
  const brandConfig = {
    customer: {
      icon: ShoppingBag,
      bgGradient: 'from-blue-600 via-blue-700 to-indigo-700',
      badgeColor: 'bg-blue-100 text-blue-700',
      activeItemClass: 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20',
      settingsPath: '/customer/settings',
    },
    vendor: {
      icon: Store,
      bgGradient: 'from-blue-600 to-indigo-700',
      badgeColor: 'bg-blue-100 text-blue-700',
      activeItemClass: 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20',
      settingsPath: '/vendor/profile',
    },
    admin: {
      icon: Shield,
      bgGradient: 'from-blue-700 to-slate-900',
      badgeColor: 'bg-blue-100 text-blue-800',
      activeItemClass: 'bg-blue-700 text-white font-bold shadow-md shadow-blue-700/20',
      settingsPath: '/admin/network-settings',
    },
    'super-admin': {
      icon: Crown,
      bgGradient: 'from-slate-900 via-indigo-950 to-blue-900',
      badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300',
      activeItemClass: 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20',
      settingsPath: '/super-admin/settings',
    },
  }[portal] || {
    icon: ShoppingBag,
    bgGradient: 'from-blue-600 to-indigo-700',
    badgeColor: 'bg-blue-100 text-blue-700',
    activeItemClass: 'bg-blue-600 text-white font-bold shadow-sm',
    settingsPath: '/customer/settings',
  };

  const BrandIcon = brandConfig.icon;

  // Filter items by permission (for Admin)
  const isItemAuthorized = (item) => {
    if (!item.permission) return true;
    if (user?.role === 'SUPER_ADMIN') return true;
    if (Array.isArray(user?.permissions)) {
      return user.permissions.includes(item.permission);
    }
    return true;
  };

  const renderNavContent = (isMobile = false) => {
    const collapsed = isMobile ? false : isCollapsed;

    return (
      <div className="flex flex-col h-full">
        {/* Header / Brand */}
        <div className={`p-4 border-b border-slate-200/80 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${brandConfig.bgGradient} text-white flex items-center justify-center font-black shadow-md shrink-0`}>
              <BrandIcon className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-slate-900 tracking-tight truncate">
                    {title}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider truncate">
                  {subtitle}
                </p>
              </div>
            )}
          </div>

          {/* Close button on mobile */}
          {isMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Desktop Collapse Toggle */}
          {!isMobile && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {navGroups.map((group) => {
            const authorizedItems = group.items.filter(isItemAuthorized);
            if (authorizedItems.length === 0) return null;

            return (
              <div key={group.group}>
                {!collapsed && (
                  <div className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {group.group}
                  </div>
                )}
                <div className="space-y-1">
                  {authorizedItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isItemActive(item.path);

                    const badgeCount = item.isCart ? cartItemCount : item.badge;

                    return (
                      <div key={item.name} className="relative group">
                        <Link
                          to={item.path}
                          className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                            isActive
                              ? brandConfig.activeItemClass
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          } ${collapsed ? 'justify-center px-2' : ''}`}
                        >
                          <div className="relative shrink-0">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'}`} />
                            {collapsed && badgeCount > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                                {badgeCount > 9 ? '9+' : badgeCount}
                              </span>
                            )}
                          </div>
                          {!collapsed && (
                            <>
                              <span className="truncate flex-1">{item.name}</span>
                              {badgeCount > 0 && (
                                <span className="ml-auto px-2 py-0.5 text-[10px] font-black rounded-full bg-blue-100 text-blue-800">
                                  {badgeCount}
                                </span>
                              )}
                            </>
                          )}
                        </Link>

                        {/* Floating Tooltip when Collapsed on Desktop */}
                        {collapsed && (
                          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                            {item.name} {badgeCount > 0 ? `(${badgeCount})` : ''}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User Card & Footer */}
        <div className={`p-3 border-t border-slate-200/80 bg-slate-50/50 ${collapsed ? 'flex flex-col items-center gap-2' : 'space-y-2'}`}>
          {!collapsed ? (
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-white border border-slate-200/60 shadow-xs">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-800 truncate">{user?.name || 'User'}</div>
                <div className="text-[10px] font-semibold text-slate-400 capitalize">{portal.replace('-', ' ')}</div>
              </div>
              <Link
                to={brandConfig.settingsPath}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                title="Account Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div
              className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer"
              title={`${user?.name || 'User'} (${user?.role || portal})`}
            >
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
          )}

          <button
            onClick={onLogout}
            className={`flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition w-full ${
              collapsed ? 'justify-center px-2' : ''
            }`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 shrink-0 text-rose-500" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 1. Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-slate-200/90 shrink-0 transition-all duration-300 z-30 sticky top-0 h-screen ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderNavContent(false)}
      </aside>

      {/* 2. Mobile Drawer with Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            />

            {/* Slide-out Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl z-10 flex flex-col"
            >
              {renderNavContent(true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PortalSidebar;
