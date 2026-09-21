import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, CheckCircle, Clock, ChevronRight, Search, Filter, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';

export const VendorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/vendor/orders');
      setOrders(res.data?.data?.orders || []);
    } catch (err) {
      console.error('Failed to fetch vendor orders', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
      CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
      PROCESSING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      PACKED: 'bg-purple-50 text-purple-700 border-purple-200',
      READY_TO_SHIP: 'bg-orange-50 text-orange-700 border-orange-200',
      SHIPPED: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return (
      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${styles[status] || styles.PENDING}`}>
        {status?.replace(/_/g, ' ')}
      </span>
    );
  };

  const filteredOrders = orders.filter((o) => {
    const matchFilter = filter === 'ALL' || o.status === filter;
    const matchSearch =
      !search ||
      o.subOrderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.shippingAddress?.fullName?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-500 font-medium animate-pulse">
        Loading vendor orders...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Order Management</h1>
          <p className="text-sm text-slate-600 mt-1">Manage, pack, and fulfill your customer orders with ease</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Pending Orders',
            count: orders.filter((o) => o.status === 'PENDING').length,
            icon: Clock,
            color: 'text-amber-600 bg-amber-50 border-amber-200',
          },
          {
            label: 'Processing',
            count: orders.filter((o) => ['CONFIRMED', 'PROCESSING', 'PACKED'].includes(o.status)).length,
            icon: Package,
            color: 'text-blue-600 bg-blue-50 border-blue-200',
          },
          {
            label: 'Ready to Ship',
            count: orders.filter((o) => o.status === 'READY_TO_SHIP').length,
            icon: Truck,
            color: 'text-orange-600 bg-orange-50 border-orange-200',
          },
          {
            label: 'Delivered',
            count: orders.filter((o) => o.status === 'DELIVERED').length,
            icon: CheckCircle,
            color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
          },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
            <div className={`p-3 rounded-2xl border ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{stat.count}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search Sub-Order / Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>

          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            {['ALL', 'PENDING', 'PROCESSING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  filter === f
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {f.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold">Sub-Order</th>
                <th className="px-6 py-4 font-bold">Customer</th>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Items</th>
                <th className="px-6 py-4 font-bold">Amount</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400 text-sm">
                    No orders matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-mono text-blue-600 font-bold text-sm">{order.subOrderNumber}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Master: {order.orderId?.toString().substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{order.shippingAddress?.fullName || 'Customer'}</div>
                      <div className="text-xs text-slate-500">
                        {order.shippingAddress?.city}, {order.shippingAddress?.state}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <div className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">
                      {order.items?.length || 0} items
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900">
                      ₹{order.itemsSubtotal}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/vendor/orders/${order._id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-3.5 py-2 rounded-xl transition-all border border-blue-200/60"
                      >
                        <span>Manage</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VendorOrders;
