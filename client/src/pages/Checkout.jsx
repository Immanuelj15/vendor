import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import api from '../services/api';
import { updateCoinBalance } from '../store/authSlice';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Loader2,
  ArrowRight,
  MapPin,
  Plus,
  ShoppingBag,
  Coins,
  Tag,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';

export const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const coinsToUse = location.state?.coinsToUse || 0;

  // Cart & Pricing State
  const [cart, setCart] = useState(null);
  const [cartLoading, setCartLoading] = useState(true);

  // Address State
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('RAZORPAY');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showMockModal, setShowMockModal] = useState(false);
  const [mockPaymentData, setMockPaymentData] = useState(null);

  useEffect(() => {
    fetchCartAndAddresses();
  }, []);

  const fetchCartAndAddresses = async () => {
    setCartLoading(true);
    try {
      const [cartRes, addrRes] = await Promise.all([
        api.get('/cart').catch(() => ({ data: { data: { cart: null } } })),
        api.get('/users/me/addresses').catch(() => ({ data: { data: [] } })),
      ]);

      const cartData = cartRes.data?.data?.cart;
      setCart(cartData);

      const addrs = addrRes.data?.data || [];
      setSavedAddresses(addrs);

      if (addrs.length > 0) {
        const def = addrs.find((a) => a.isDefault) || addrs[0];
        setSelectedAddressId(def._id);
        setAddress({
          name: def.name,
          phone: def.phone,
          street: def.streetAddress,
          city: def.city,
          state: def.state,
          zip: def.postalCode,
        });
      } else {
        setUseNewAddress(true);
      }
    } catch (e) {
      console.error('Checkout fetch error:', e);
    } finally {
      setCartLoading(false);
    }
  };

  const handleSelectSavedAddress = (addr) => {
    setSelectedAddressId(addr._id);
    setUseNewAddress(false);
    setAddress({
      name: addr.name,
      phone: addr.phone,
      street: addr.streetAddress,
      city: addr.city,
      state: addr.state,
      zip: addr.postalCode,
    });
  };

  const handleChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleVerifyPayment = async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
    setCheckoutStep('verifying_payment');
    try {
      await api.post('/payments/verify', {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      // Refresh coins if any used or rewarded
      api.get('/auth/me').then((res) => {
        if (res.data?.data?.user?.fairCoinBalance !== undefined) {
          dispatch(updateCoinBalance(res.data.data.user.fairCoinBalance));
        }
      });

      alert('🎉 Payment verified and order placed successfully!');
      navigate('/account/orders');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Payment verification failed');
      setSubmitting(false);
      setCheckoutStep('idle');
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);
    setCheckoutStep('creating_order');

    try {
      const orderPayload = {
        paymentMethod,
        fairCoinsToRedeem: coinsToUse,
      };

      if (!useNewAddress && selectedAddressId) {
        orderPayload.shippingAddressId = selectedAddressId;
      } else {
        orderPayload.shippingAddress = {
          name: address.name,
          phone: address.phone,
          streetAddress: address.street,
          city: address.city,
          state: address.state,
          postalCode: address.zip,
          country: 'India',
        };
      }

      const res = await api.post('/orders', orderPayload);
      const order = res.data.data.order;

      if (paymentMethod === 'COD') {
        alert(`Order #${order.orderNumber} placed successfully via Cash on Delivery!`);
        navigate('/account/orders');
        return;
      }

      setCheckoutStep('opening_payment');
      const paymentRes = await api.post('/payments/create-order', {
        orderId: order._id,
      });

      const paymentData = paymentRes.data.data;
      const isMock = paymentData.razorpayOrderId?.startsWith('order_mock_') || paymentData.keyId === 'rzp_test_demo';
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || isMock) {
        setMockPaymentData({
          order,
          paymentData,
        });
        setShowMockModal(true);
        setSubmitting(false);
        setCheckoutStep('idle');
        return;
      }

      const options = {
        key: paymentData.keyId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: 'FairKart Marketplace',
        description: `Payment for Order #${order.orderNumber}`,
        order_id: paymentData.razorpayOrderId,
        handler: async function (response) {
          await handleVerifyPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
        },
        prefill: {
          name: address.name,
          contact: address.phone,
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: function () {
            setErrorMessage('Payment process was cancelled. You can complete payment from My Orders.');
            setSubmitting(false);
            setCheckoutStep('idle');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setErrorMessage(`Payment Failed: ${resp.error?.description || 'Gateway transaction failed'}`);
        setSubmitting(false);
        setCheckoutStep('idle');
      });
      rzp.open();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to initiate checkout process');
      setSubmitting(false);
      setCheckoutStep('idle');
    }
  };

  const calculateSubtotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  };

  const subtotal = calculateSubtotal();
  const couponDiscount = cart?.discountAmount || 0;
  const coinDiscount = Math.floor(coinsToUse / 10);
  const grandTotal = Math.max(0, subtotal - couponDiscount - coinDiscount);

  if (cartLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-600 text-sm font-medium">Preparing secure checkout...</p>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-sm">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Your Cart is Empty</h2>
        <p className="text-sm text-slate-600">Please add items to your cart before proceeding to checkout.</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all"
        >
          <span>Explore Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8"
    >
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>256-Bit SSL Encrypted Checkout</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Checkout & Payment</h1>
        <p className="text-sm text-slate-600 mt-1">Review your delivery address, items, and select payment method</p>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-sm font-medium shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Address & Payment Gateway Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Delivery Address */}
          <div className="bg-white border border-slate-200/80 p-6 sm:p-7 rounded-3xl shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                <span>1. Delivery Address</span>
              </h3>
              {savedAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setUseNewAddress(!useNewAddress)}
                  className="text-xs sm:text-sm text-blue-600 font-bold hover:underline"
                >
                  {useNewAddress ? 'Select Saved Address' : '+ Enter New Address'}
                </button>
              )}
            </div>

            {/* Saved Addresses List */}
            {!useNewAddress && savedAddresses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {savedAddresses.map((addr) => {
                  const isSelected = selectedAddressId === addr._id;
                  return (
                    <div
                      key={addr._id}
                      onClick={() => handleSelectSavedAddress(addr)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-600/20 text-slate-900'
                          : 'border-slate-200 bg-slate-50/40 text-slate-700 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-slate-900">{addr.name}</span>
                        {addr.isDefault && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{addr.streetAddress}</p>
                      <p className="text-xs text-slate-700 font-medium mt-1">
                        {addr.city}, {addr.state} - {addr.postalCode}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Phone: {addr.phone}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* New Address Inputs */
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Recipient Full Name"
                    value={address.name}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
                  />
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="Phone Number (10 digits)"
                    value={address.phone}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
                  />
                </div>
                <input
                  type="text"
                  name="street"
                  required
                  placeholder="Street Address / House No / Area"
                  value={address.street}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
                />
                <div className="grid grid-cols-3 gap-3.5">
                  <input
                    type="text"
                    name="city"
                    required
                    placeholder="City"
                    value={address.city}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
                  />
                  <input
                    type="text"
                    name="state"
                    required
                    placeholder="State"
                    value={address.state}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
                  />
                  <input
                    type="text"
                    name="zip"
                    required
                    placeholder="PIN Code"
                    value={address.zip}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Payment Method */}
          <div className="bg-white border border-slate-200/80 p-6 sm:p-7 rounded-3xl shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
              <CreditCard className="w-5 h-5 text-amber-500" />
              <span>2. Select Payment Method</span>
            </h3>

            <div className="space-y-3">
              <label
                onClick={() => setPaymentMethod('RAZORPAY')}
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'RAZORPAY'
                    ? 'bg-blue-50/60 border-blue-600 ring-2 ring-blue-600/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'RAZORPAY' ? 'border-blue-600' : 'border-slate-300'
                    }`}
                  >
                    {paymentMethod === 'RAZORPAY' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                  </div>
                  <div>
                    <span className="text-sm font-bold block text-slate-900">Razorpay Online Payment</span>
                    <span className="text-xs text-slate-500">UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, NetBanking</span>
                  </div>
                </div>
                <span className="text-xs font-extrabold bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
                  Instant
                </span>
              </label>

              <label
                onClick={() => setPaymentMethod('COD')}
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'COD'
                    ? 'bg-blue-50/60 border-blue-600 ring-2 ring-blue-600/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'COD' ? 'border-blue-600' : 'border-slate-300'
                    }`}
                  >
                    {paymentMethod === 'COD' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                  </div>
                  <div>
                    <span className="text-sm font-bold block text-slate-900">Cash on Delivery (COD)</span>
                    <span className="text-xs text-slate-500">Pay cash upon parcel delivery at your doorstep</span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Order Review & Total Summary */}
        <div className="bg-white border border-slate-200/80 p-6 sm:p-7 rounded-3xl shadow-xs space-y-6 sticky top-24">
          <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-4">Order Summary</h3>

          {/* Item Thumbnails & Quantities */}
          <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
            {cart.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm">
                <img
                  src={item.productId?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                  alt={item.productId?.name}
                  className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{item.productId?.name}</p>
                  <p className="text-slate-500 text-xs">
                    Qty: {item.quantity} × ₹{item.price}
                  </p>
                </div>
                <span className="font-extrabold text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Pricing Breakdown */}
          <div className="space-y-3 text-sm text-slate-600 border-t border-slate-100 pt-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
            </div>

            {couponDiscount > 0 && (
              <div className="flex justify-between text-blue-600 font-medium">
                <span>Coupon ({cart.couponCode})</span>
                <span>-₹{couponDiscount.toFixed(2)}</span>
              </div>
            )}

            {coinDiscount > 0 && (
              <div className="flex justify-between text-amber-600 font-medium">
                <span>Fair Coins ({coinsToUse} coins)</span>
                <span>-₹{coinDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Delivery / Shipping</span>
              <span className="text-emerald-600 font-bold">FREE</span>
            </div>

            <div className="flex justify-between items-baseline pt-3 border-t border-slate-200">
              <span className="font-black text-base text-slate-900">Grand Total</span>
              <span className="text-2xl font-black text-blue-600">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.99]"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>
                  {checkoutStep === 'creating_order' && 'Creating Order...'}
                  {checkoutStep === 'opening_payment' && 'Opening Gateway...'}
                  {checkoutStep === 'verifying_payment' && 'Verifying Payment...'}
                  {checkoutStep === 'idle' && 'Processing...'}
                </span>
              </div>
            ) : (
              <>
                <span>Pay ₹{grandTotal.toFixed(2)} & Place Order</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Mock Development Razorpay Modal */}
      {showMockModal && mockPaymentData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 p-6 sm:p-7 rounded-3xl w-full max-w-md space-y-5 shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-lg">
                ₹
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">Razorpay Test Gateway (Sandbox)</h3>
                <p className="text-xs text-slate-500">Simulate test payment for Order #{mockPaymentData.order?.orderNumber}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl space-y-2.5 text-sm border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Amount:</span>
                <span className="font-extrabold text-slate-900">₹{(mockPaymentData.paymentData?.amount / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Test Order ID:</span>
                <span className="font-mono text-slate-800 text-xs">{mockPaymentData.paymentData?.razorpayOrderId}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowMockModal(false);
                  setErrorMessage('Payment cancelled by user.');
                }}
                className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Cancel / Fail
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowMockModal(false);
                  await handleVerifyPayment({
                    razorpayOrderId: mockPaymentData.paymentData?.razorpayOrderId,
                    razorpayPaymentId: `pay_mock_${Date.now()}`,
                    razorpaySignature: `mock_signature_test_${Date.now()}`,
                  });
                }}
                className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
              >
                Simulate Success ✅
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
