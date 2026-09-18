import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, Truck, CheckCircle, Clock, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const VendorOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/vendor/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setOrder(data.data.order);
      }
    } catch (err) {
      console.error('Failed to fetch order detail', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (action) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/vendor/orders/${id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        fetchOrder();
      } else {
        const data = await response.json();
        alert('Error: ' + data.message);
      }
    } catch (err) {
      alert('Network error while updating status');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-slate-500 text-sm font-medium">Loading order fulfillment details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-16 text-center text-slate-600 font-medium">
        Order not found or you don't have permission to view it.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Back & Title Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/vendor/orders')}
          className="p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl border border-slate-200/80 shadow-xs transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Order #{order.subOrderNumber}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs">
            <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span>Items to Fulfill</span>
            </h2>
            <div className="space-y-3.5">
              {order.items?.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-4 bg-slate-50/70 border border-slate-100 rounded-2xl items-center"
                >
                  <div className="w-16 h-16 bg-white border border-slate-200 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                    {item.productImage ? (
                      <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{item.productName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Quantity: {item.quantity}</p>
                    <p className="text-sm font-bold text-blue-600 mt-0.5">₹{item.price}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Subtotal</p>
                    <p className="text-base font-black text-slate-900">₹{item.price * item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs">
            <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Order Lifecycle Status</span>
            </h2>
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Current Phase: {order.status}</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Update status as you prepare items and package the delivery parcel.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Actions & Info */}
        <div className="space-y-6">
          {/* Fulfillment Action Box */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="text-lg font-black text-slate-900">Fulfillment Action</h2>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status:</span>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                {order.status}
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {order.status === 'PENDING' && (
                <button
                  onClick={() => updateStatus('accept')}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex justify-center items-center gap-2"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  <span>Accept Order</span>
                </button>
              )}
              {order.status === 'CONFIRMED' && (
                <button
                  onClick={() => updateStatus('process')}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex justify-center items-center gap-2"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                  <span>Start Processing</span>
                </button>
              )}
              {order.status === 'PROCESSING' && (
                <button
                  onClick={() => updateStatus('pack')}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-purple-500/20 transition-all flex justify-center items-center gap-2"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                  <span>Mark as Packed</span>
                </button>
              )}
              {order.status === 'PACKED' && (
                <button
                  onClick={() => updateStatus('ready-to-ship')}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-orange-500/20 transition-all flex justify-center items-center gap-2"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                  <span>Request Courier Pickup</span>
                </button>
              )}
              {['READY_TO_SHIP', 'SHIPPED', 'DELIVERED'].includes(order.status) && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                  <p className="text-sm font-bold text-emerald-800">Handled by Courier</p>
                  <p className="text-xs text-emerald-600 mt-0.5">Logistics partner has taken over this fulfillment.</p>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Customer Delivery</span>
            </h2>
            <div className="space-y-1 text-sm text-slate-700">
              <p className="font-bold text-slate-900">{order.shippingAddress?.fullName}</p>
              <p className="text-slate-500">{order.shippingAddress?.phone}</p>
              <p className="pt-2 leading-relaxed">{order.shippingAddress?.streetAddress}</p>
              {order.shippingAddress?.landmark && <p className="text-slate-500">Landmark: {order.shippingAddress?.landmark}</p>}
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.state}
              </p>
              <p className="font-medium text-slate-900">PIN: {order.shippingAddress?.zipCode}</p>
            </div>
          </div>

          {/* Financials */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Order Financials</span>
            </h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900">₹{order.itemsSubtotal}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-medium">
                <span>Platform Commission</span>
                <span>- ₹{order.platformCommission}</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="font-black text-slate-900">Net Merchant Earning</span>
                <span className="font-black text-xl text-emerald-600">₹{order.vendorEarning}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VendorOrderDetail;
