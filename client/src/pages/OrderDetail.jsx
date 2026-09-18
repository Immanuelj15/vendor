import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  MapPin,
  FileText,
  RotateCcw,
  Loader2,
  CreditCard,
  Tag,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Return request states
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnItems, setReturnItems] = useState([]);
  const [returnFulfillmentId, setReturnFulfillmentId] = useState('');
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  useEffect(() => {
    fetchOrderAndTracking();
  }, [id]);

  const fetchOrderAndTracking = async () => {
    try {
      setLoading(true);
      setError(null);
      const [orderRes, trackingRes] = await Promise.all([
        api.get(`/orders/${id}`),
        api.get(`/fulfillment/orders/${id}/tracking`).catch(() => ({ data: { data: null } })),
      ]);
      if (orderRes.data?.success) {
        setOrder(orderRes.data.data.order);
      }
      if (trackingRes.data?.success) {
        setTrackingData(trackingRes.data.data);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await api.post(`/returns/orders/${id}/cancel`);
      alert('Order cancelled successfully!');
      fetchOrderAndTracking();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleReturnRequest = async (e) => {
    e.preventDefault();
    if (returnItems.length === 0) {
      alert('Please select at least one item to return');
      return;
    }
    setReturnSubmitting(true);
    try {
      await api.post(`/returns/orders/${id}/return`, {
        fulfillmentId: returnFulfillmentId || undefined,
        reason: returnReason,
        items: returnItems,
      });
      alert('Return request submitted successfully! Administration will review your request.');
      setShowReturnForm(false);
      fetchOrderAndTracking();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request return');
    } finally {
      setReturnSubmitting(false);
    }
  };

  const handleDownloadInvoice = () => {
    window.open(`http://localhost:5000/api/orders/${id}/invoice`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Loading order information...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Error Loading Order</h2>
        <p className="text-xs text-slate-500">{error || 'Order record not found or inaccessible.'}</p>
        <Link to="/account/orders" className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to My Orders
        </Link>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'PAID';
  const isCancellable = ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.orderStatus);
  const isDelivered = order.orderStatus === 'DELIVERED';
  const timeline = trackingData?.timeline || [];

  const lifecycleStages = [
    { label: 'Confirmed', key: 'CONFIRMED' },
    { label: 'Processing', key: 'PROCESSING' },
    { label: 'Packed', key: 'PACKED' },
    { label: 'Shipped', key: 'SHIPPED' },
    { label: 'In Transit', key: 'IN_TRANSIT' },
    { label: 'Out for Delivery', key: 'OUT_FOR_DELIVERY' },
    { label: 'Delivered', key: 'DELIVERED' },
  ];

  const currentStatusIndex = lifecycleStages.findIndex((s) => s.key === order.orderStatus);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/account/orders"
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 shadow-xs transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Order #{order.orderNumber}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                Payment: {order.paymentStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Placed on {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadInvoice}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 inline-flex items-center gap-1.5 transition"
          >
            <FileText className="w-4 h-4" />
            <span>Download Invoice</span>
          </button>

          {isCancellable && (
            <button
              onClick={handleCancelOrder}
              className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition"
            >
              Cancel Order
            </button>
          )}

          {isDelivered && (
            <button
              onClick={() => {
                setReturnItems(order.items.map((i) => ({ productId: i.productId, name: i.name, quantity: i.quantity })));
                setShowReturnForm(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4 text-amber-700" />
              <span>Request Return</span>
            </button>
          )}
        </div>
      </div>

      {/* Delivery Lifecycle Progress Tracker */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs space-y-4">
        <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Truck className="w-4 h-4 text-blue-600" />
          <span>Delivery Progress & Status</span>
        </h3>

        <div className="overflow-x-auto pb-2">
          <div className="min-w-[650px] flex items-center justify-between relative py-2">
            <div className="absolute top-5 left-6 right-6 h-1 bg-slate-100 z-0 rounded-full" />
            <div
              className="absolute top-5 left-6 h-1 bg-blue-600 z-0 transition-all duration-500 rounded-full"
              style={{
                width: `${Math.max(0, (currentStatusIndex / (lifecycleStages.length - 1)) * 92)}%`,
              }}
            />

            {lifecycleStages.map((stage, idx) => {
              const isPastOrCurrent = currentStatusIndex >= idx;
              const isCurrent = currentStatusIndex === idx;

              return (
                <div key={stage.key} className="flex flex-col items-center relative z-10 space-y-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                      isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-500/20'
                        : isPastOrCurrent
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-slate-400 border border-slate-300'
                    }`}
                  >
                    {isPastOrCurrent ? '✓' : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] font-bold text-center ${
                      isCurrent ? 'text-blue-700' : isPastOrCurrent ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Order Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Products & Address */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Ordered Products Table */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Package className="w-5 h-5 text-blue-600" />
              <span>Ordered Products ({order.items?.length || 0})</span>
            </h3>

            <div className="space-y-3">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/60 border border-slate-200/80">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={item.image || item.productImageSnapshot || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120'}
                      alt={item.name}
                      className="w-14 h-14 rounded-xl object-cover bg-white border border-slate-200 shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{item.name || item.productNameSnapshot}</h4>
                      {item.skuSnapshot && (
                        <p className="text-[10px] text-slate-400 font-mono">SKU: {item.skuSnapshot}</p>
                      )}
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Qty: {item.quantity} × ₹{item.price || item.unitPrice}
                      </p>
                    </div>
                  </div>
                  <span className="font-black text-sm text-slate-900">₹{((item.price || item.unitPrice) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Contact Information */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs space-y-3 text-xs">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span>Delivery Address</span>
            </h3>

            <div className="text-slate-600 space-y-1 leading-relaxed">
              <p className="font-bold text-sm text-slate-900">{order.deliveryAddressSnapshot?.name || 'Customer'}</p>
              <p>{order.deliveryAddressSnapshot?.streetAddress || order.deliveryAddressSnapshot?.street}</p>
              <p>{order.deliveryAddressSnapshot?.city}, {order.deliveryAddressSnapshot?.state} - {order.deliveryAddressSnapshot?.postalCode || order.deliveryAddressSnapshot?.zip}</p>
              <p className="text-slate-400 mt-1">Phone: {order.deliveryAddressSnapshot?.phone || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Summary, Payment & Timeline */}
        <div className="space-y-6">
          
          {/* Payment Summary */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-3">Payment Summary</h3>

            <div className="space-y-2.5 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-slate-800">₹{order.subtotal || order.itemsSubtotal}</span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between text-blue-600 font-semibold">
                  <span>Coupon Discount ({order.couponCode})</span>
                  <span>-₹{order.discount}</span>
                </div>
              )}

              {order.coinDiscount > 0 && (
                <div className="flex justify-between text-amber-600 font-semibold">
                  <span>Fair Coins ({order.fairCoinsUsed} coins)</span>
                  <span>-₹{order.coinDiscount}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span className="text-emerald-600 font-bold">{order.shippingFee > 0 ? `₹${order.shippingFee}` : 'FREE'}</span>
              </div>

              <div className="flex justify-between items-baseline pt-3 border-t border-slate-100">
                <span className="font-bold text-sm text-slate-900">Grand Total</span>
                <span className="text-2xl font-black text-slate-900">₹{order.total || order.grandTotal}</span>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] space-y-1 text-slate-500">
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-bold text-slate-800">{order.paymentMethod}</span>
                </div>
                {order.paymentId && (
                  <div className="flex justify-between">
                    <span>Payment Ref:</span>
                    <span className="font-mono text-slate-500 text-[10px]">{order.paymentId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fulfillment Tracking Timeline */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Tracking Timeline</span>
            </h3>

            {timeline.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">Order confirmed. Shipment dispatch in progress.</p>
            ) : (
              <div className="relative border-l border-slate-200 pl-4 space-y-5 text-xs">
                {timeline.map((event, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                    <p className="font-bold text-slate-800">{event.status}</p>
                    {event.note && <p className="text-slate-500 text-[11px] mt-0.5">{event.note}</p>}
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(event.timestamp).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Return Request Modal */}
      <AnimatePresence>
        {showReturnForm && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 p-6 rounded-3xl w-full max-w-md space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-lg text-slate-900">Submit Return Request</h3>
                <button
                  onClick={() => setShowReturnForm(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleReturnRequest} className="space-y-4">
                <textarea
                  required
                  placeholder="Describe reason for returning product(s)..."
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white h-24 transition-colors"
                />

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700">Items to return:</span>
                  {returnItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-800 font-semibold truncate max-w-[240px]">{item.name}</span>
                      <input
                        type="number"
                        min={1}
                        max={item.quantity}
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...returnItems];
                          updated[idx].quantity = Math.min(item.quantity, parseInt(e.target.value) || 1);
                          setReturnItems(updated);
                        }}
                        className="w-14 bg-white border border-slate-200 text-center rounded-lg text-slate-800 text-xs py-1 font-bold"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReturnForm(false)}
                    className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={returnSubmitting}
                    className="py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
                  >
                    {returnSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderDetail;
