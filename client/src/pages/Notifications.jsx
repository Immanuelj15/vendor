import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../store/notificationSlice';
import {
  Bell,
  Check,
  Trash2,
  Inbox,
  ShoppingBag,
  Coins,
  ShieldCheck,
  Truck,
  Flame,
  Award,
  Circle,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Notifications = () => {
  const dispatch = useDispatch();
  const { list, unreadCount, isLoading, page, pages } = useSelector(
    (state) => state.notifications
  );

  const [filter, setFilter] = useState(''); // '' for all, 'false' for unread, 'true' for read
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchNotifications({ page: currentPage, isRead: filter }));
  }, [dispatch, currentPage, filter]);

  const handleMarkRead = (id) => {
    dispatch(markAsRead(id));
  };

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead());
  };

  const handleDelete = (id) => {
    dispatch(deleteNotification(id));
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const getTypeMeta = (type) => {
    switch (type) {
      case 'COIN_EARNED':
      case 'COMMISSION_EARNED':
        return { icon: Coins, color: 'text-amber-600 bg-amber-50 border-amber-200' };
      case 'ORDER_CONFIRMED':
      case 'ORDER_PROCESSING':
      case 'ORDER_PACKED':
      case 'ORDER_DISPATCHED':
      case 'ORDER_OUT_FOR_DELIVERY':
      case 'ORDER_DELIVERED':
      case 'ORDER_CANCELLED':
        return { icon: ShoppingBag, color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'KYC_SUBMITTED':
      case 'KYC_APPROVED':
      case 'KYC_REJECTED':
        return { icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
      case 'DELIVER_ASSIGNED':
      case 'DELIVERY_ASSIGNED':
      case 'DELIVERY_FAILED':
        return { icon: Truck, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
      case 'SUBSCRIPTION_CREATED':
      case 'SUBSCRIPTION_ACTIVATED':
      case 'SUBSCRIPTION_EXPIRING':
      case 'SUBSCRIPTION_EXPIRED':
        return { icon: Flame, color: 'text-rose-600 bg-rose-50 border-rose-200' };
      case 'SPIN_REWARD':
        return { icon: Award, color: 'text-purple-600 bg-purple-50 border-purple-200' };
      default:
        return { icon: Bell, color: 'text-slate-600 bg-slate-100 border-slate-200' };
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col justify-between min-h-[550px]">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                  <Bell className="w-6 h-6 text-blue-600" />
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-rose-500 text-white font-bold px-2.5 py-0.5 rounded-full">
                      {unreadCount} unread
                    </span>
                  )}
                </h1>
                <p className="text-xs text-slate-500 mt-1">Stay updated with orders, rewards, coins, and system alerts</p>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-bold px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100/70 border border-blue-100 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark all as read</span>
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <button
                onClick={() => handleFilterChange('')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  filter === ''
                    ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/70'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleFilterChange('false')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  filter === 'false'
                    ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/70'
                }`}
              >
                Unread
              </button>
              <button
                onClick={() => handleFilterChange('true')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  filter === 'true'
                    ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/70'
                }`}
              >
                Read
              </button>
            </div>

            {/* Notifications List */}
            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-20 bg-slate-100 rounded-2xl"></div>
                <div className="h-20 bg-slate-100 rounded-2xl"></div>
                <div className="h-20 bg-slate-100 rounded-2xl"></div>
              </div>
            ) : list.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                <Inbox className="w-12 h-12 text-slate-300 mb-2" />
                <h3 className="text-sm font-bold text-slate-800">No notifications found</h3>
                <p className="text-xs text-slate-400 mt-0.5">You are all caught up with your activities!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {list.map((item) => {
                  const { icon: Icon, color } = getTypeMeta(item.type);
                  return (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-4 p-4 rounded-2xl border transition-all ${
                        item.isRead
                          ? 'bg-white border-slate-200/70 opacity-80'
                          : 'bg-blue-50/30 border-blue-200/80 shadow-xs'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-xs ${color}`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                              {item.link ? (
                                <Link to={item.link} className="hover:text-blue-600 transition-colors">
                                  {item.title}
                                </Link>
                              ) : (
                                <span>{item.title}</span>
                              )}
                              {!item.isRead && (
                                <Circle className="w-2.5 h-2.5 fill-blue-600 text-blue-600 shrink-0" />
                              )}
                            </h3>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed break-words">{item.message}</p>
                          </div>
                          <span className="text-[11px] text-slate-400 shrink-0 font-medium mt-0.5">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-3 pt-2 border-t border-slate-100">
                          {!item.isRead && (
                            <button
                              onClick={() => handleMarkRead(item._id)}
                              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {pages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-8">
              <span className="text-xs text-slate-500 font-semibold">
                Page {page} of {pages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page === pages}
                  onClick={() => setCurrentPage((p) => Math.min(pages, p + 1))}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
  );
};

export default Notifications;
