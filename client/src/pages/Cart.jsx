import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { ShoppingBag, Coins, Trash2, ArrowRight, Tag, Loader2, X, Percent, LayoutDashboard, ArrowLeft } from 'lucide-react';

export const Cart = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coinsToUse, setCoinsToUse] = useState(0);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cart');
      const cartData = res.data.data.cart;
      setCart(cartData);
      if (cartData?.couponCode) {
        setCouponCode(cartData.couponCode);
        setCouponSuccess(`Coupon "${cartData.couponCode}" is active!`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (productId, quantity, variantSku = '') => {
    try {
      const res = await api.put('/cart/update', { productId, quantity, variantSku });
      setCart(res.data.data.cart);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode) return;
    setApplyingCoupon(true);
    setCouponError('');
    setCouponSuccess('');
    try {
      const res = await api.post('/cart/apply-coupon', { code: couponCode });
      if (res.data?.success) {
        setCart(res.data.data.cart);
        setCouponSuccess(`Coupon "${couponCode}" applied successfully!`);
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid or expired coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setApplyingCoupon(true);
    setCouponError('');
    setCouponSuccess('');
    try {
      const res = await api.post('/cart/apply-coupon', { code: '' });
      if (res.data?.success) {
        setCart(res.data.data.cart);
        setCouponCode('');
        setCouponSuccess('');
      }
    } catch (err) {
      setCouponError('Failed to remove coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const calculateSubtotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  };

  const subtotal = calculateSubtotal();
  const couponDiscount = cart?.discountAmount || 0;
  const coinDiscount = Math.floor(coinsToUse / 10);
  const total = Math.max(0, subtotal - couponDiscount - coinDiscount);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header with back navigation to Customer Dashboard */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/customer/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 mb-1.5 transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Shopping Cart</h1>
        </div>

        <Link
          to="/customer/dashboard"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all border border-blue-200/60 shadow-xs"
        >
          <LayoutDashboard className="w-4 h-4 text-blue-600" />
          <span>Customer Dashboard</span>
        </Link>
      </div>

      {!cart || !cart.items || cart.items.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Your cart is empty</h2>
          <p className="text-xs text-slate-500">Add products from the marketplace to start earning Fair Coins.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
            >
              <span>Browse Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/customer/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200/80 transition-all"
            >
              <LayoutDashboard className="w-4 h-4 text-blue-600" />
              <span>Go to Dashboard</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Item List */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div
                key={`${item.productId?._id}-${item.variantSku}`}
                className="bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center gap-4 shadow-sm hover:border-blue-200 transition-all"
              >
                <img
                  src={item.productId?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                  alt={item.productId?.name}
                  className="w-16 h-16 object-cover rounded-xl bg-slate-100 shrink-0 border border-slate-200"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-slate-900 truncate">{item.productId?.name}</h4>
                  {item.variantSku && (
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">Option: {item.variantSku}</div>
                  )}
                  <div className="text-xs font-black text-blue-600 mt-1">₹{Number(item.price).toFixed(2)}</div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
                  <button
                    onClick={() => handleUpdateQuantity(item.productId?._id, item.quantity - 1, item.variantSku)}
                    className="w-6 h-6 flex items-center justify-center text-xs font-bold text-slate-600 hover:bg-white hover:text-slate-900 rounded transition-colors"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold text-slate-900 px-2">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQuantity(item.productId?._id, item.quantity + 1, item.variantSku)}
                    className="w-6 h-6 flex items-center justify-center text-xs font-bold text-slate-600 hover:bg-white hover:text-slate-900 rounded transition-colors"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => handleUpdateQuantity(item.productId?._id, 0, item.variantSku)}
                  className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Remove Item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Summary Drawer & Code promotions */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-6 shadow-sm h-fit">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">Order Summary</h3>

            {/* Coupon Code Panel */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                <span>Promo Coupon Code</span>
              </label>
              
              {cart.couponCode ? (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-3 rounded-xl">
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-blue-600" />
                      <span>{cart.couponCode}</span>
                    </div>
                    <div className="text-[10px] text-blue-700 mt-0.5 font-medium">Applied (₹{Number(couponDiscount).toFixed(2)} saved)</div>
                  </div>
                  <button 
                    onClick={handleRemoveCoupon} 
                    disabled={applyingCoupon}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 text-xs text-slate-800 uppercase rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={applyingCoupon || !couponCode}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
                  >
                    Apply
                  </button>
                </form>
              )}

              {couponError && <p className="text-[10px] text-rose-600 font-medium">{couponError}</p>}
              {couponSuccess && !couponError && <p className="text-[10px] text-emerald-600 font-medium">{couponSuccess}</p>}
            </div>

            {/* Fair Coins Redemption Box */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-800 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-500" />
                  Redeem Fair Coins
                </span>
                <span className="text-[11px] text-amber-700 font-medium">Balance: {Number(user?.fairCoinBalance || 0).toLocaleString()}</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  max={user?.fairCoinBalance || 0}
                  min={0}
                  value={coinsToUse}
                  onChange={(e) => setCoinsToUse(Math.min(user?.fairCoinBalance || 0, Number(e.target.value)))}
                  placeholder="Enter coins"
                  className="w-full bg-white text-xs text-slate-900 rounded-lg px-3 py-2 border border-amber-300 focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-amber-700 font-medium">10 Fair Coins = ₹1 Discount</p>
            </div>

            {/* Summary calculation log */}
            <div className="space-y-2.5 text-xs text-slate-600 border-b border-slate-100 pb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">₹{Number(subtotal).toFixed(2)}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-blue-600 font-medium">
                  <span>Coupon Discount</span>
                  <span>-₹{Number(couponDiscount).toFixed(2)}</span>
                </div>
              )}

              {coinDiscount > 0 && (
                <div className="flex justify-between text-amber-700 font-medium">
                  <span>Fair Coins Discount</span>
                  <span>-₹{Number(coinDiscount).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-blue-600 font-bold">FREE</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="font-bold text-sm text-slate-800">Total</span>
              <span className="text-2xl font-black text-slate-900">₹{Number(total).toFixed(2)}</span>
            </div>

            <button
              onClick={() => navigate('/checkout', { state: { coinsToUse } })}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
