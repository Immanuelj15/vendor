import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Package, Loader2, FileText, ArrowRight, CreditCard, Tag, RotateCcw, Truck, CheckCircle2 } from 'lucide-react';

const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'];
const RETURN_CANCEL_STATUSES = ['RETURN_REQUESTED', 'RETURNED', 'REFUNDED', 'CANCELLED'];

export const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentTab = searchParams.get('tab') || 'all';

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/my-orders');
      setOrders(res.data.data.orders || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = (orderId) => {
    window.open(`http://localhost:5000/api/orders/${orderId}/invoice`, '_blank');
  };

  const activeOrdersCount = orders.filter((o) => ACTIVE_STATUSES.includes(o.orderStatus)).length;
  const returnOrdersCount = orders.filter((o) => RETURN_CANCEL_STATUSES.includes(o.orderStatus)).length;

  const filteredOrders = orders.filter((order) => {
    if (currentTab === 'tracking') {
      return ACTIVE_STATUSES.includes(order.orderStatus);
    }
    if (currentTab === 'returns') {
      return RETURN_CANCEL_STATUSES.includes(order.orderStatus);
    }
    return true;
  });

  const handleTabChange = (tabKey) => {
    if (tabKey === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: tabKey });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {currentTab === 'tracking'
              ? 'Track Active Shipments'
              : currentTab === 'returns'
              ? 'Returns & Cancellations'
              : 'My Marketplace Orders'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {currentTab === 'tracking'
              ? 'Real-time dispatch, transit, and delivery progress for your orders'
              : currentTab === 'returns'
              ? 'Review return requests, cancelled orders, and refund status'
              : 'Track orders, review payment status, and download tax invoices'}
          </p>
        </div>

        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs self-start sm:self-auto"
        >
          <span>Shop Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => handleTabChange('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            currentTab === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>All Orders</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              currentTab === 'all' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('tracking')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            currentTab === 'tracking'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Track Active</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              currentTab === 'tracking' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {activeOrdersCount}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('returns')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            currentTab === 'returns'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Returns & Refunds</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              currentTab === 'returns' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {returnOrdersCount}
          </span>
        </button>
      </div>

      {/* Orders List / Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-500 space-y-3 shadow-xs">
          {currentTab === 'tracking' ? (
            <>
              <Truck className="w-12 h-12 text-slate-400 mx-auto" />
              <p className="text-base font-bold text-slate-900">No active shipments in transit</p>
              <p className="text-xs text-slate-500">All of your recent orders have either been delivered or concluded.</p>
            </>
          ) : currentTab === 'returns' ? (
            <>
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="text-base font-bold text-slate-900">No return requests or cancelled orders</p>
              <p className="text-xs text-slate-500">All your orders are in good standing.</p>
            </>
          ) : (
            <>
              <Package className="w-12 h-12 text-slate-400 mx-auto" />
              <p className="text-base font-bold text-slate-900">No orders placed yet</p>
              <p className="text-xs text-slate-500">Explore verified vendor products in our catalog and place your first order.</p>
            </>
          )}

          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isPaid = order.paymentStatus === 'PAID';
            const isUnpaid = order.paymentStatus !== 'PAID' && order.paymentMethod !== 'COD' && order.orderStatus !== 'CANCELLED';

            return (
              <div key={order._id} className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-4 hover:border-blue-200 shadow-xs transition-all">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">Order #{order.orderNumber}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({order.publicOrderId || order._id})</span>
                    </div>
                    <div className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Payment Status Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        isPaid
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : order.paymentStatus === 'FAILED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      Payment: {isPaid ? 'PAID' : 'NOT PAID'}
                    </span>

                    {/* Order Status Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        order.orderStatus === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : order.orderStatus === 'CANCELLED' || order.orderStatus === 'RETURNED'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {order.orderStatus?.replace(/_/g, ' ')}
                    </span>

                    <span className="text-base font-black text-slate-900 ml-2">₹{order.total || order.grandTotal}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image || item.productImageSnapshot || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{item.name || item.productNameSnapshot}</div>
                          <div className="text-slate-500 text-[11px]">Qty: {item.quantity} × ₹{item.price || item.unitPrice}</div>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900">₹{((item.price || item.unitPrice) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Actions & Pricing Breakdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Link
                      to={`/customer/orders/${order._id}`}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs inline-flex items-center gap-1.5"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>View Details & Tracking</span>
                    </Link>

                    <button
                      onClick={() => handleDownloadInvoice(order._id)}
                      className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs transition inline-flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Download Invoice</span>
                    </button>
                  </div>

                  {isUnpaid && (
                    <Link
                      to={`/customer/orders/${order._id}`}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Complete Payment</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
