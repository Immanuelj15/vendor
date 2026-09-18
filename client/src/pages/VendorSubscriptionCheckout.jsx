import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Loader2, ShieldCheck, CheckCircle } from 'lucide-react';

export const VendorSubscriptionCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [order, setOrder] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const { planId, billingCycle } = location.state || {};

  useEffect(() => {
    if (!planId || !billingCycle) {
      navigate('/vendor/subscription');
      return;
    }
    createOrder();
  }, [planId, billingCycle]);

  const createOrder = async () => {
    try {
      setLoading(true);
      const res = await api.post('/vendor-subscriptions/order', { planId, billingCycle });
      setOrder(res.data.data.order);
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating order');
      navigate('/vendor/subscription');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMock = async () => {
    try {
      setVerifying(true);
      // Simulating a successful payment verification flow abstraction
      await api.post('/vendor-subscriptions/verify', {
        orderId: order._id,
        paymentId: 'mock_pay_123',
        paymentStatus: 'SUCCESS'
      });
      setSuccess(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Payment failed');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-xl text-center border border-emerald-100">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">Payment Successful!</h1>
        <p className="text-sm text-slate-500 mb-8">Your subscription has been activated successfully.</p>
        <button 
          onClick={() => navigate('/vendor/subscription')}
          className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Complete Checkout</h1>
      
      {order && (
        <div className="bg-white rounded-2xl shadow border p-6">
          <h2 className="text-lg font-bold border-b pb-4 mb-4">Order Summary</h2>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Plan</span>
              <span className="font-bold text-slate-800">{billingCycle}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total Amount</span>
              <span className="font-bold text-slate-800 text-xl">₹{order.amount}</span>
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl border mb-6 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              This is a secure 256-bit SSL encrypted payment. For the purpose of this module, clicking "Proceed to Pay" will simulate a successful payment gateway response and activate your subscription server-side.
            </p>
          </div>

          <button 
            disabled={verifying}
            onClick={handlePaymentMock}
            className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70 flex justify-center items-center gap-2 transition-all"
          >
            {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Proceed to Pay'}
          </button>
        </div>
      )}
    </div>
  );
};
