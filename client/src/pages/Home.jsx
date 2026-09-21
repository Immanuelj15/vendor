import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import {
  ShoppingBag,
  Coins,
  Dices,
  Users,
  ArrowRight,
  Sparkles,
  Search,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  Crown,
  Copy,
  Check,
  Heart,
  Laptop,
  Shirt,
  Home as HomeIcon,
  Sparkle,
  Watch,
  Headphones as HeadphonesIcon,
  Flame,
  Zap,
  Store,
  QrCode,
  Receipt,
  TrendingUp,
  Percent,
  Clock,
  ArrowUpRight,
  Building2,
  ChevronRight,
  Layers,
  Award,
  BadgeCheck,
  Gift,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_CARDS = [
  { name: 'Electronics & Tech', slug: 'electronics-gadgets', icon: Laptop, color: 'from-blue-500 to-indigo-600', count: '180+ Items', tag: 'Hot' },
  { name: 'Fashion & Style', slug: 'fashion-apparel', icon: Shirt, color: 'from-purple-500 to-pink-600', count: '240+ Items', tag: 'Trending' },
  { name: 'Home & Kitchen', slug: 'home-kitchen', icon: HomeIcon, color: 'from-amber-500 to-orange-600', count: '95+ Items', tag: 'New' },
  { name: 'Beauty & Wellness', slug: 'beauty-personal-care', icon: Sparkle, color: 'from-rose-500 to-red-500', count: '110+ Items', tag: 'Popular' },
  { name: 'Smart Wearables', slug: 'watches-wearables', icon: Watch, color: 'from-teal-500 to-emerald-600', count: '75+ Items', tag: '20% OFF' },
  { name: 'Audio & Sound', slug: 'audio-sound', icon: HeadphonesIcon, color: 'from-sky-500 to-blue-600', count: '65+ Items', tag: 'Top Rated' },
];

export const Home = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [wishlistProductIds, setWishlistProductIds] = useState([]);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [addingCartId, setAddingCartId] = useState(null);
  const [cartSuccessId, setCartSuccessId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  // Live Flash Sale Timer State
  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 24, seconds: 45 });

  // Referral Calculator State
  const [calcDirectInvites, setCalcDirectInvites] = useState(5);
  const [calcFriendSpend, setCalcFriendSpend] = useState(2000);

  // Audience Explorer Tab State
  const [audienceTab, setAudienceTab] = useState('shoppers');

  useEffect(() => {
    fetchFeaturedProducts();
    if (isAuthenticated) {
      fetchWishlist();
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated]);

  const fetchFeaturedProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await api.get('/products', { params: { limit: 12, sort: 'rating' } });
      setFeaturedProducts(res.data?.data?.products || []);
    } catch (err) {
      console.error('Failed to load featured products for home page', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/wishlist');
      if (res.data?.success && res.data.data?.wishlist) {
        setWishlistProductIds(res.data.data.wishlist.products.map((p) => p._id));
      }
    } catch (e) {
      // Ignore if guest
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  const handleToggleWishlist = async (productId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.post('/wishlist', { productId });
      if (res.data?.success && res.data.data?.wishlist) {
        setWishlistProductIds(res.data.data.wishlist.products.map((p) => p._id));
      }
    } catch (err) {
      console.error('Wishlist toggle error', err);
    }
  };

  const handleAddToCart = async (e, prod) => {
    e.preventDefault();
    e.stopPropagation();
    if (prod.stock <= 0) return;
    setAddingCartId(prod._id);
    try {
      await api.post('/cart/add', {
        productId: prod._id,
        quantity: 1,
      });
      setCartSuccessId(prod._id);
      setTimeout(() => setCartSuccessId(null), 2000);
    } catch (err) {
      console.error('Add to cart failed:', err);
    } finally {
      setAddingCartId(null);
    }
  };

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopiedReferral(true);
      setTimeout(() => setCopiedReferral(false), 2500);
    }
  };

  const filteredProducts = featuredProducts.filter((p) => {
    if (activeTab === 'deals') return (p.mrp && p.mrp > p.price) || (p.discountPrice > 0 && p.discountPrice < p.price);
    if (activeTab === 'highRating') return (p.rating || 4.5) >= 4.5;
    return true;
  });

  // Approx 3-5% network yield per level
  const estimatedCoinsMonthly = Math.round(
    calcDirectInvites * (calcFriendSpend * 0.05) + Math.pow(calcDirectInvites, 2) * (calcFriendSpend * 0.015)
  );

  return (
    <div className="relative min-h-screen space-y-16 pb-24 text-slate-800 bg-slate-50/70 overflow-hidden">
      {/* Engineered Small Grid Pattern Across Entire Home Page */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-75"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(203, 213, 225, 0.45) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(203, 213, 225, 0.45) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />

      {/* ========================================================================= */}
      {/* 1. LIGHT RADIANT HERO SHOWCASE WITH RICH ANIMATIONS                      */}
      {/* ========================================================================= */}
      <section className="relative z-10 overflow-hidden rounded-3xl bg-gradient-to-b from-blue-50/80 via-white/95 to-indigo-50/40 backdrop-blur-xs p-6 sm:p-12 lg:p-16 shadow-xl shadow-blue-500/5 m-3 sm:m-6 lg:m-8 border border-blue-100/90">
        {/* Animated Light Glowing Orbs */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-24 -right-24 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], rotate: [0, -90, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none"
        />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          {/* Animated Announcement Pill */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-blue-200 text-xs font-bold text-blue-800 shadow-sm hover:shadow-md transition-shadow cursor-default"
          >
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>India's 1st Multi-Stakeholder Marketplace • 1 Fair Coin = ₹1.00 INR Real Value</span>
          </motion.div>

          {/* Headline with Smooth Entrance */}
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.15]"
            >
              Shop Smarter. Sell Bigger.{' '}
              <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
                Earn Real Wealth Together.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal"
            >
              Explore 1,000+ verified brand products, earn guaranteed 100% cashable Fair Coins on every order, and unlock 9-level automated community royalties.
            </motion.p>
          </div>

          {/* Quick Search Bar */}
          <motion.form
            onSubmit={handleSearchSubmit}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative max-w-2xl mx-auto"
          >
            <div className="relative flex items-center shadow-lg shadow-blue-500/5 rounded-2xl overflow-hidden bg-white p-1.5 border border-slate-200 hover:border-blue-400 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
              <Search className="ml-3.5 w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands (Apple, Samsung, Nike, Sony)..."
                className="w-full px-3 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-blue-500/20 shrink-0"
              >
                Search
              </motion.button>
            </div>

            {/* Popular Search Tags */}
            <div className="flex items-center justify-center gap-2 flex-wrap pt-3 text-[11px] text-slate-500">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" /> Trending:
              </span>
              {['Smartphones', 'Laptops', 'Watches', 'Sneakers', 'Headphones', 'Home Decor'].map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => navigate(`/products?search=${encodeURIComponent(kw)}`)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors border border-slate-200/80 font-medium shadow-2xs"
                >
                  {kw}
                </button>
              ))}
            </div>
          </motion.form>

          {/* Quick Action Navigation CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-3.5 pt-2"
          >
            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/products"
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Explore Marketplace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/customer/rewards"
                className="px-6 py-3.5 rounded-2xl bg-white hover:bg-amber-50/60 border border-amber-200 text-slate-800 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-xs hover:shadow-md"
              >
                <Dices className="w-4 h-4 text-amber-500" />
                <span>Daily Lucky Spin</span>
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/vendor/register"
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-md shadow-amber-400/20"
              >
                <Store className="w-4 h-4 text-slate-950" />
                <span>Become a Vendor</span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Trust Guarantees Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-slate-200/80 text-slate-700 text-xs">
            <motion.div whileHover={{ y: -2 }} className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-800">100% Escrow Verified</span>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs">
              <Coins className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-semibold text-slate-800">₹1.00 Value per Coin</span>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs">
              <Truck className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-semibold text-slate-800">Express Hub Delivery</span>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs">
              <RotateCcw className="w-4 h-4 text-purple-600 shrink-0" />
              <span className="font-semibold text-slate-800">7-Day Easy Returns</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. ECOSYSTEM EXPLORER (LIGHT TABS FOR SHOPPERS / VENDORS / LOCAL SHOPS)    */}
      {/* ========================================================================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-50/60 via-indigo-50/50 to-purple-50/60 rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-sm space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
              Ecosystem Opportunities
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              A Platform Built for Everyone
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Select your role to discover the exclusive benefits and financial rewards waiting for you.
            </p>
          </div>

          {/* Role Tabs */}
          <div className="flex justify-center flex-wrap gap-2">
            {[
              { id: 'shoppers', label: 'For Shoppers & Earners', icon: ShoppingBag },
              { id: 'stores', label: 'For Local Shopkeepers & Offline Bills', icon: Store },
              { id: 'vendors', label: 'For Manufacturers & Vendors', icon: Building2 },
              { id: 'network', label: 'For Referral Networkers', icon: Users }
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = audienceTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAudienceTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-105'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Tab Content Panels with AnimatePresence */}
          <AnimatePresence mode="wait">
            <motion.div
              key={audienceTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm"
            >
              {audienceTab === 'shoppers' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="space-y-3 md:col-span-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Direct Buyer Value
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                      Guaranteed Fair Coins on Every Purchase
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Unlike typical loyalty points that expire or carry complex redemption rules, Fair Coins hold real currency value. 1 Fair Coin = ₹1 INR. Use them to offset any checkout order immediately or convert to gift cards.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2 text-xs">
                      <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 font-semibold">• Daily Wheel Spins</span>
                      <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 font-semibold">• Offline Bill Cashbacks</span>
                      <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 font-semibold">• Escrow Protected Orders</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Link
                      to="/products"
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold text-center shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <span>Start Shopping Deals</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/customer/rewards"
                      className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold text-center transition-all flex items-center justify-center gap-2"
                    >
                      <Dices className="w-4 h-4 text-amber-500" />
                      <span>Try Lucky Wheel Spin</span>
                    </Link>
                  </div>
                </div>
              )}

              {audienceTab === 'stores' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="space-y-3 md:col-span-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
                      <QrCode className="w-3.5 h-3.5" /> Offline-to-Online Loyalty
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                      Turn Walk-In Customers into Lifetime Online Royalties
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Do you run a physical retail shop or grocery counter? Place your custom FairKart QR Standee at your cash register. Whenever customers scan to earn Fair Coins or upload bills, they are permanently attributed to your shop—earning you continuous commissions whenever they buy anything online!
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2 text-xs">
                      <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 font-semibold">• Free QR Standee Kit</span>
                      <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 font-semibold">• Zero Hardware Cost</span>
                      <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 font-semibold">• Direct Bank Payouts</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Link
                      to="/customer/offline-bills"
                      className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold text-center shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>Upload Offline Bill</span>
                    </Link>
                    <Link
                      to="/portal-gateway"
                      className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold text-center transition-all flex items-center justify-center gap-2"
                    >
                      <Store className="w-4 h-4 text-blue-600" />
                      <span>Join as Retail Partner</span>
                    </Link>
                  </div>
                </div>
              )}

              {audienceTab === 'vendors' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="space-y-3 md:col-span-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                      <Building2 className="w-3.5 h-3.5" /> High Merchant Margins
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                      Sell Across India with 0% Listing Fees
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      List your products on FairKart's rapidly growing consumer network. Benefit from escrow safety, automated regional hub pickups, fast T+2 banking settlements, and powerful attribution analytics.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2 text-xs">
                      <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 font-semibold">• 24-Hr Express KYC</span>
                      <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 font-semibold">• National Logistics Reach</span>
                      <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 font-semibold">• Dedicated Vendor Portal</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Link
                      to="/vendor/register"
                      className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold text-center shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Store className="w-4 h-4" />
                      <span>Register as Vendor</span>
                    </Link>
                    <Link
                      to="/vendor/login"
                      className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold text-center transition-all"
                    >
                      Existing Vendor Login
                    </Link>
                  </div>
                </div>
              )}

              {audienceTab === 'network' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="space-y-3 md:col-span-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                      <Users className="w-3.5 h-3.5" /> Community Royalty Network
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                      Earn Real Coin Royalties Across 9 Tiers
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      When you invite friends to FairKart, you unlock automated referral rewards. Receive commissions every time anyone in your 9-level tree shops, pays bills, or subscribes. Build a sustainable passive revenue stream.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2 text-xs">
                      <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 font-semibold">• 9 Level Depth</span>
                      <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 font-semibold">• Real-Time Tree Graph</span>
                      <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 font-semibold">• Instant Coin Credits</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Link
                      to="/customer/referrals"
                      className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold text-center shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      <span>View Referral Dashboard</span>
                    </Link>
                    <Link
                      to="/register"
                      className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold text-center transition-all"
                    >
                      Create Free Account
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FLASH DEALS BANNER (RADIANT CORAL LIGHT THEME)                         */}
      {/* ========================================================================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-sm relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider border border-rose-200">
                <Zap className="w-4 h-4 text-rose-600" />
                <span>Limited Time Flash Sale</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Supercharged Deals • Up to 65% OFF
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md">
                Verified genuine products. Extra 2X Fair Coins credited instantly to your wallet.
              </p>
            </div>

            {/* Live Light Countdown Clock */}
            <div className="flex items-center gap-2.5">
              <motion.div animate={{ scale: [1, 1.03, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="flex flex-col items-center bg-white shadow-sm rounded-2xl p-3 sm:p-4 min-w-[64px] border border-rose-200">
                <span className="text-2xl sm:text-3xl font-black font-mono text-rose-600">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-500">Hours</span>
              </motion.div>
              <span className="text-2xl font-black text-rose-400">:</span>
              <motion.div animate={{ scale: [1, 1.03, 1] }} transition={{ repeat: Infinity, duration: 2, delay: 0.3 }} className="flex flex-col items-center bg-white shadow-sm rounded-2xl p-3 sm:p-4 min-w-[64px] border border-rose-200">
                <span className="text-2xl sm:text-3xl font-black font-mono text-rose-600">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-500">Mins</span>
              </motion.div>
              <span className="text-2xl font-black text-rose-400">:</span>
              <motion.div animate={{ scale: [1, 1.03, 1] }} transition={{ repeat: Infinity, duration: 2, delay: 0.6 }} className="flex flex-col items-center bg-white shadow-sm rounded-2xl p-3 sm:p-4 min-w-[64px] border border-rose-200">
                <span className="text-2xl sm:text-3xl font-black font-mono text-rose-600">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-500">Secs</span>
              </motion.div>
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/products"
                className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-md shadow-rose-600/20 transition-all shrink-0 flex items-center gap-2"
              >
                <span>View Flash Deals</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 4. TOP CATEGORIES BROWSER WITH MICRO-ANIMATIONS                          */}
      {/* ========================================================================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Shop by Popular Category
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Carefully vetted items from verified manufacturers and direct sellers</p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORY_CARDS.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                whileHover={{ y: -6, scale: 1.02 }}
              >
                <Link
                  to={`/products?category=${cat.slug}`}
                  className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-4 hover:border-blue-400 hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center space-y-2.5 h-full"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center shadow-md shadow-blue-500/10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {cat.name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-semibold mt-0.5">{cat.count}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/60">
                    {cat.tag}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. FEATURED PRODUCTS SHOWCASE                                            */}
      {/* ========================================================================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Featured Marketplace Picks
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Top-rated items eligible for 100% Fair Coin cashbacks and free delivery</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'All Items' },
              { id: 'deals', label: 'Flash Deals' },
              { id: 'highRating', label: '★ 4.5+ Rated' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid with Animations */}
        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3 animate-pulse">
                <div className="aspect-square bg-slate-100 rounded-2xl w-full" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-8 bg-slate-100 rounded w-full mt-2" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 space-y-3">
            <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="font-bold text-sm text-slate-800">No featured products found in this view</p>
            <Link to="/products" className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline">
              <span>Browse Full Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((prod, idx) => {
              const hasDiscount = (prod.mrp && prod.mrp > prod.price) || (prod.discountPrice > 0 && prod.discountPrice < prod.price);
              const discountPct = prod.discountValue || (hasDiscount ? Math.round(((prod.mrp - prod.price) / prod.mrp) * 100) : 0);
              const isOutOfStock = prod.stock <= 0;

              return (
                <motion.div
                  key={prod._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.04 }}
                  whileHover={{ y: -6 }}
                  className="group bg-white border border-slate-200/80 hover:border-blue-300 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Image Area */}
                    <div className="relative aspect-square bg-slate-50 overflow-hidden">
                      <Link to={`/products/${prod.slug || prod._id}`}>
                        <img
                          src={prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'}
                          alt={prod.name}
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </Link>

                      {/* Wishlist Button */}
                      <button
                        onClick={() => handleToggleWishlist(prod._id)}
                        className="absolute top-3 left-3 p-2 rounded-full bg-white/90 hover:bg-white border border-slate-200 shadow-xs text-slate-600 transition-colors z-10"
                        title="Add to Wishlist"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            wishlistProductIds.includes(prod._id) ? 'text-rose-500 fill-rose-500' : 'text-slate-400'
                          }`}
                        />
                      </button>

                      {/* Badges */}
                      <div className="absolute top-3 right-3 flex flex-col items-end gap-1 z-10">
                        {discountPct > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                            {discountPct}% OFF
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold flex items-center gap-1 shadow-xs">
                          <Coins className="w-3 h-3 text-amber-500" />
                          <span>+{prod.coinReward || Math.round(prod.price * 0.05)} Coins</span>
                        </span>
                      </div>

                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-20">
                          <span className="px-3 py-1 bg-rose-600 text-white text-xs font-black rounded-xl uppercase">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold truncate max-w-[120px] text-blue-600">
                          {prod.categoryId?.name || prod.brand || 'Verified Brand'}
                        </span>
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{prod.rating ? prod.rating.toFixed(1) : '4.8'}</span>
                        </div>
                      </div>

                      <Link
                        to={`/products/${prod.slug || prod._id}`}
                        className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 block"
                      >
                        {prod.name}
                      </Link>

                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-base sm:text-lg font-black text-slate-900">
                          ₹{Number(prod.price).toLocaleString('en-IN')}
                        </span>
                        {hasDiscount && prod.mrp && (
                          <span className="text-xs text-slate-400 line-through">
                            ₹{Number(prod.mrp).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 pt-0">
                    <button
                      onClick={(e) => handleAddToCart(e, prod)}
                      disabled={isOutOfStock || addingCartId === prod._id}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        cartSuccessId === prod._id
                          ? 'bg-emerald-600 text-white'
                          : isOutOfStock
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/15'
                      }`}
                    >
                      {cartSuccessId === prod._id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added to Cart!</span>
                        </>
                      ) : addingCartId === prod._id ? (
                        <span>Adding...</span>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 6. GAMIFICATION: LUCKY WHEEL (BRIGHT CARNIVAL LIGHT THEME)                */}
      {/* ========================================================================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50/90 via-orange-50/70 to-yellow-50/90 p-6 sm:p-10 border border-amber-200/90 shadow-lg shadow-amber-500/5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold">
                <Dices className="w-4 h-4 text-amber-600" />
                <span>Daily Free Spin for Registered Users</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Spin the Wheel.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600">
                  Win up to 500 Fair Coins!
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg">
                Log in every 24 hours to take your free turn on the FairKart Lucky Wheel. Coins won are credited instantly into your Fair Coins wallet and can be used immediately on any checkout.
              </p>

              <div className="flex flex-wrap gap-3.5 pt-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/customer/rewards"
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 flex items-center gap-2"
                  >
                    <Dices className="w-4 h-4" />
                    <span>Play Lucky Wheel Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>

                <Link
                  to="/customer/rewards"
                  className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-amber-200 text-slate-700 font-bold text-xs sm:text-sm transition-all shadow-2xs"
                >
                  View Past Winners
                </Link>
              </div>
            </div>

            {/* Visual Teaser Light Card */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 border border-amber-200/80 shadow-md shadow-amber-500/5 space-y-4 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-orange-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20"
              >
                <Dices className="w-12 h-12 text-white" />
              </motion.div>
              <div>
                <div className="text-lg font-bold text-slate-900">Daily Coin Pool: 25,000 Coins</div>
                <div className="text-xs text-slate-500 mt-0.5">Guaranteed minimum 10 Coins per daily spin</div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 text-xs font-semibold">
                <div className="bg-amber-50 text-amber-900 p-2.5 rounded-xl border border-amber-200">🎁 500 Coins</div>
                <div className="bg-amber-50 text-amber-900 p-2.5 rounded-xl border border-amber-200">🎟️ VIP Pass</div>
                <div className="bg-amber-50 text-amber-900 p-2.5 rounded-xl border border-amber-200">🔥 ₹100 Off</div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 7. 9-LEVEL REFERRAL CALCULATOR (BRIGHT SKY LIGHT THEME)                   */}
      {/* ========================================================================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-white p-6 sm:p-10 border border-blue-200/80 shadow-lg shadow-blue-500/5 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider border border-blue-200">
                <Users className="w-4 h-4" />
                <span>9-Level Automated Referral Network</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Calculate Your Monthly Passive Coin Earnings
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
                Earn passive royalties whenever anyone in your 9-tier upline or downline buys products, uploads offline bills, or subscribes.
              </p>
            </div>

            {isAuthenticated && (
              <div className="flex items-center gap-2 bg-white border border-blue-200 px-4 py-2.5 rounded-2xl shadow-sm">
                <span className="text-xs text-slate-500 font-semibold">Your Code:</span>
                <span className="font-mono font-black text-base text-blue-600 tracking-wider">
                  {user?.referralCode || 'FAIRKART'}
                </span>
                <button
                  onClick={copyReferralCode}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors ml-1 text-slate-600"
                  title="Copy Referral Code"
                >
                  {copiedReferral ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          {/* Interactive Calculator Slider Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="space-y-6 lg:col-span-2">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                  <span>Number of Direct Friends You Invite:</span>
                  <span className="text-blue-600 font-mono text-base font-black">{calcDirectInvites} friends</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="25"
                  value={calcDirectInvites}
                  onChange={(e) => setCalcDirectInvites(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                  <span>Average Monthly Shopping per Friend:</span>
                  <span className="text-blue-600 font-mono text-base font-black">₹{calcFriendSpend.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="500"
                  value={calcFriendSpend}
                  onChange={(e) => setCalcFriendSpend(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
                />
              </div>
            </div>

            {/* Estimated Earnings Display in Radiant Blue Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white text-center space-y-2 shadow-lg shadow-blue-500/25">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-100">Estimated Potential Earnings</div>
              <motion.div
                key={estimatedCoinsMonthly}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-3xl sm:text-4xl font-black font-mono tracking-tight"
              >
                ₹{estimatedCoinsMonthly.toLocaleString('en-IN')}
              </motion.div>
              <div className="text-[11px] font-semibold text-blue-200">
                ≈ {estimatedCoinsMonthly.toLocaleString('en-IN')} Fair Coins / month
              </div>
              <Link
                to="/customer/referrals"
                className="mt-3 block w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 text-blue-900 text-xs font-bold transition-all shadow-md"
              >
                View Full Network Tree
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. VIP CLUB MEMBERSHIP CALLOUT (LIGHT GOLD/AMBER THEME)                   */}
      {/* ========================================================================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-3xl bg-gradient-to-r from-amber-100 via-orange-50 to-yellow-100 text-slate-900 p-6 sm:p-10 border border-amber-300 shadow-md shadow-amber-500/5 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-200/80 text-amber-900 text-xs font-bold uppercase tracking-wider border border-amber-300">
              <Crown className="w-4 h-4 text-amber-700" />
              <span>FairKart VIP Club</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Unlock 2X Fair Coins & Free Express Delivery
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Upgrade to the FairKart VIP Pass for exclusive member discounts, priority support dispatch, and double coin cashbacks on every order.
            </p>
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/customer/subscription"
              className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs sm:text-sm font-black uppercase tracking-wider shadow-md shadow-amber-500/20 transition-all shrink-0 block text-center"
            >
              Upgrade to VIP Pass
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 9. WHY FAIRKART: FOUR TRUST PILLARS (CLEAN LIGHT CARDS)                   */}
      {/* ========================================================================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8 space-y-1">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900">Why India Shops on FairKart</h3>
          <p className="text-xs text-slate-500">Built from the ground up for transparency, security, and community wealth</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs hover:shadow-md transition-all space-y-2.5"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-slate-900">100% Escrow Security</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Buyer payments are safeguarded in platform escrow until package delivery is verified and accepted by you.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs hover:shadow-md transition-all space-y-2.5"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-inner">
              <Coins className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-slate-900">Real ₹1 Value per Coin</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every single Fair Coin earned represents ₹1.00 INR. Redeem at checkout without minimum order barriers.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs hover:shadow-md transition-all space-y-2.5"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-inner">
              <Truck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-slate-900">Certified Fast Logistics</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              State and taluk hub fulfillment ensure fast dispatches and real-time tracking straight to your doorstep.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs hover:shadow-md transition-all space-y-2.5"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-inner">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-slate-900">7-Day Hassle-Free Returns</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Doorstep pickup returns with prompt coin credits or immediate bank refunds on eligible marketplace items.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
