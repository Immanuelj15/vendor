import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Bell, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchNotifications, markAsRead, markAllAsRead } from '../../store/notificationSlice';

export const NotificationMenu = ({ portal = 'customer' }) => {
  const dispatch = useDispatch();
  const { list = [], unreadCount = 0 } = useSelector((state) => state.notifications || {});
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    dispatch(fetchNotifications({ page: 1, limit: 5 }));
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
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const viewAllLink = portal === 'customer' ? '/account/notifications' : `/${portal}/notifications`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200/80 shadow-2xl p-4 z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {unreadCount} NEW
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => dispatch(markAllAsRead())}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto py-2 divide-y divide-slate-50">
              {list && list.length > 0 ? (
                list.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => {
                      if (!n.read) dispatch(markAsRead(n._id));
                    }}
                    className={`p-2.5 rounded-xl cursor-pointer transition text-left ${
                      !n.read ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-800 line-clamp-1">{n.title}</p>
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                    <span className="text-[9px] text-slate-400 mt-1 block">
                      {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2 stroke-1" />
                  No new notifications
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 text-center">
              <Link
                to={viewAllLink}
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 transition block py-1"
              >
                View all notifications →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
