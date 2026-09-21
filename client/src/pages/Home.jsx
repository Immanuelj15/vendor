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
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_CARDS = [
  { name: 'Electronics & Tech', slug: 'electronics-gadgets', icon: Laptop, color: 'from-blue-600 to-indigo-600', count: '180+ Items', tag: 'Hot' },
  { name: 'Fashion & Style', slug: 'fashion-apparel', icon: Shirt, color: 'from-purple-600 to-pink-600', count: '240+ Items', tag: 'Trending' },
  { name: 'Home & Living', slug: 'home-kitchen', icon: HomeIcon, color: 'from-amber-500 to-orange-600', count: '95+ Items', tag: 'New' },
  { name: 'Beauty & Wellness', slug: 'beauty-personal-care', icon: Sparkle, color: 'from-rose-500 to-red-500', count: '110+ Items', tag: 'Popular' },
  { name: 'Smart Wearables', slug: 'watches-wearables', icon: Watch, color: 'from-teal-500 to-emerald-600', count: '75+ Items', tag: '20% OFF' },
  { name: 'Audio & Acoustics', slug: 'audio-sound', icon: HeadphonesIcon, color: 'from-sky-500 to-blue-600', count: '65+ Items', tag: 'Top Rated' },
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

  // Flash Sale Timer State
  const [timeLeft, setTimeLeft] = useState({ hours: 7, minutes: 42, seconds: 19 });

  // Referral Calculator State
  const [calcDirectInvites, setCalcDirectInvites] = useState(5);
  const [calcFriendSpend, setCalcFriendSpend] = useState(1500);

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

  // Calculation for referral simulator (approx 3% network yield per level)
  const estimatedCoinsMonthly = Math.round(calcDirectInvites * (calcFriendSpend * 0.05) + Math.pow(calcDirectInvites, 2) * (calcFriendSpend * 0.015));

  return (
    <div className="space-y-16 pb-24 text-slate-800">
      {/* ========================================================================= */}
      {/* 1. HERO SHOWCASE WITH ECOSYSTEM PILLARS & LIVE STATS                      */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-12 lg:p-16 shadow-2xl shadow-blue-950/20 m-3 sm:m-6 lg:m-8 border border-white/10">
        {/* Glow & Mesh Ambient Backgrounds */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          {/* Top Announcement Pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-blue-200 shadow-inner"
          >
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>India's 1st Multi-Stakeholder Marketplace • 1 Fair Coin = ₹1.00 INR</span>
          </motion.div>

          {/* Bold Engaging Headline */}
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]"
            >
              Shop Smarter. Sell Bigger.{' '}
              <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300">
                Earn Real Wealth Together.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed"
            >
              Discover 1,000+ verified brands, earn 100% cashable Fair Coins on every order, and share passive 9-level commissions with our nationwide merchant network.
            </motion.p>
          </div>

          {/* Quick Search Form with Live Badges */}
          <motion.form
            onSubmit={handleSearchSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative max-w-2xl mx-auto"
          >
            <div className="relative flex items-center shadow-2xl rounded-2xl overflow-hidden bg-white p-1.5 border border-white/20">
              <Search className="ml-3.5 w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands (Apple, Samsung, Nike, Sony)..."
                className="w-full px-3 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-blue-500/20 shrink-0"
              >
                Search
              </button>
            </div>

            {/* Trending Keyword Pills */}
            <div className="flex items-center justify-center gap-2 flex-wrap pt-3 text-[11px] text-slate-400">
              <span className="font-bold text-slate-300 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" /> Trending:
              </span>
              {['Smartphones', 'Laptops', 'Watches', 'Sneakers', 'Headphones', 'Home Appliances'].map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => navigate(`/products?search=${encodeURIComponent(kw)}`)}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors border border-white/10 font-medium"
                >
                  {kw}
                </button>
              ))}
            </div>
          </motion.form>

          {/* Quick Action Navigation CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <Link
              to="/products"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-500/25 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/customer/rewards"
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 backdrop-blur-sm"
            >
              <Dices className="w-4 h-4 text-amber-400" />
              <span>Daily Lucky Spin</span>
            </Link>

            <Link
              to="/vendor/register"
              className="px-6 py-3.5 rounded-2xl bg-amber-400/90 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg shadow-amber-400/20"
            >
              <Store className="w-4 h-4 text-slate-900" />
              <span>Become a Vendor</span>
            </Link>
          </div>

          {/* Trust Guarantees Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-white/10 text-slate-300 text-xs">
            <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">100% Escrow Verified</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
              <Coins className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-semibold">₹1.00 Value per Coin</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
              <Truck className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="font-semibold">Express Hub Delivery</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
              <RotateCcw className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="font-semibold">7-Day Easy Returns</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. ECOSYSTEM HUB: ATTRACTING EVERY GROUP (SHOPPERS / VENDORS / STORES)     */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/70 to-purple-50/70 rounded-3xl p-6 sm:p-8 border border-blue-100/80 shadow-sm space-y-6">
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
                <button
                  key={tab.id}
                  onClick={() => setAudienceTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-105'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Panels */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
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
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FLASH DEALS WITH LIVE COUNTDOWN TIMER & COIN MULTIPLIERS               */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-rose-500 via-rose-600 to-red-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-rose-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Limited Time Flash Sale</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Supercharged Deals • Up to 65% OFF
              </h2>
              <p className="text-xs sm:text-sm text-rose-100 max-w-md">
                Verified genuine stock. Extra 2X Fair Coins credited instantly to your wallet.
              </p>
            </div>

            {/* Live Countdown Clock */}
            <div className="flex items-center gap-2.5">
              <div className="flex flex-col items-center bg-black/25 backdrop-blur-md rounded-2xl p-3 sm:p-4 min-w-[64px] border border-white/10">
                <span className="text-2xl sm:text-3xl font-black font-mono">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase font-bold text-rose-200">Hours</span>
              </div>
              <span className="text-2xl font-black text-rose-200">:</span>
              <div className="flex flex-col items-center bg-black/25 backdrop-blur-md rounded-2xl p-3 sm:p-4 min-w-[64px] border border-white/10">
                <span className="text-2xl sm:text-3xl font-black font-mono">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase font-bold text-rose-200">Mins</span>
              </div>
              <span className="text-2xl font-black text-rose-200">:</span>
              <div className="flex flex-col items-center bg-black/25 backdrop-blur-md rounded-2xl p-3 sm:p-4 min-w-[64px] border border-white/10">
                <span className="text-2xl sm:text-3xl font-black font-mono">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase font-bold text-rose-200">Secs</span>
              </div>
            </div>

            <Link
              to="/products"
              className="px-6 py-3.5 rounded-2xl bg-white text-rose-600 hover:bg-rose-50 text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg transition-all shrink-0 flex items-center gap-2"
            >
              <span>View Flash Deals</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. TOP CATEGORIES BROWSER WITH MICRO-ANIMATIONS                          */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
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
          {CATEGORY_CARDS.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.slug}
                to={`/products?category=${cat.slug}`}
                className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-4 hover:border-blue-400 hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center space-y-2.5"
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
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. FEATURED & TRENDING PRODUCTS SHOWCASE                                 */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
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
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setActiveTab('deals')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'deals'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Flash Deals
            </button>
            <button
              onClick={() => setActiveTab('highRating')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'highRating'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              ★ 4.5+ Rated
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
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
            <p className="font-bold text-sm text-slate-800">No featured products found in this category</p>
            <Link to="/products" className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline">
              <span>Browse Full Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((prod) => {
              const hasDiscount = (prod.mrp && prod.mrp > prod.price) || (prod.discountPrice > 0 && prod.discountPrice < prod.price);
              const discountPct = prod.discountValue || (hasDiscount ? Math.round(((prod.mrp - prod.price) / prod.mrp) * 100) : 0);
              const isOutOfStock = prod.stock <= 0;

              return (
                <div
                  key={prod._id}
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
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 6. GAMIFICATION: LUCKY WHEEL & DAILY FAIR COIN WINNINGS                    */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white p-6 sm:p-10 border border-purple-800/40 shadow-xl shadow-purple-950/20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-amber-300">
                <Dices className="w-4 h-4 text-amber-400" />
                <span>Daily Free Spin for Registered Users</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                Spin the Wheel.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300">
                  Win up to 500 Fair Coins!
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed max-w-lg">
                Log in every 24 hours to take your free turn on the FairKart Lucky Wheel. Coins won are credited instantly into your Fair Coins wallet and can be used on your next order.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  to="/customer/rewards"
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg shadow-amber-400/25 flex items-center gap-2"
                >
                  <Dices className="w-4 h-4" />
                  <span>Play Lucky Wheel Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/customer/rewards"
                  className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm transition-all"
                >
                  View Past Winners
                </Link>
              </div>
            </div>

            {/* Visual Teaser Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 space-y-4 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20 animate-spin" style={{ animationDuration: '16s' }}>
                <Dices className="w-12 h-12 text-slate-950" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">Daily Coin Pool: 25,000 Coins</div>
                <div className="text-xs text-indigo-200 mt-1">Guaranteed minimum 10 Coins per daily spin</div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 text-xs font-semibold">
                <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">🎁 500 Coins</div>
                <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">🎟️ VIP Day Pass</div>
                <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">🔥 ₹100 Coupon</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. VIRAL 9-LEVEL REFERRAL SIMULATOR & NETWORK GROWTH                      */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-950 text-white p-6 sm:p-10 border border-blue-800/40 shadow-xl shadow-blue-950/20 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold text-blue-200 uppercase tracking-wider">
                <Users className="w-4 h-4" />
                <span>9-Level Automated Referral Network</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                Calculate Your Passive Monthly Coin Earnings
              </h3>
              <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
                Earn passive royalties whenever anyone in your 9-tier upline or downline buys products, uploads bills, or joins subscriptions.
              </p>
            </div>

            {isAuthenticated && (
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2.5 rounded-2xl backdrop-blur-md">
                <span className="text-xs text-blue-200 font-semibold">Your Referral Code:</span>
                <span className="font-mono font-black text-base text-amber-300 tracking-wider">
                  {user?.referralCode || 'FAIRKART'}
                </span>
                <button
                  onClick={copyReferralCode}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors ml-1"
                  title="Copy Code"
                >
                  {copiedReferral ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white" />}
                </button>
              </div>
            )}
          </div>

          {/* Interactive Calculator Slider Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/20 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="space-y-6 lg:col-span-2">
              <div>
                <div className="flex justify-between text-xs font-bold text-blue-200 mb-2">
                  <span>Number of Direct Friends You Invite:</span>
                  <span className="text-amber-300 font-mono text-base">{calcDirectInvites} friends</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="25"
                  value={calcDirectInvites}
                  onChange={(e) => setCalcDirectInvites(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-blue-200 mb-2">
                  <span>Average Monthly Shopping per Friend:</span>
                  <span className="text-amber-300 font-mono text-base">₹{calcFriendSpend.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="500"
                  value={calcFriendSpend}
                  onChange={(e) => setCalcFriendSpend(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Estimated Earnings Display */}
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-slate-950 text-center space-y-2 shadow-lg shadow-amber-500/20">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-900">Estimated Potential Earnings</div>
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight">
                ₹{estimatedCoinsMonthly.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] font-semibold text-slate-800">
                ≈ {estimatedCoinsMonthly.toLocaleString('en-IN')} Fair Coins / month
              </div>
              <Link
                to="/customer/referrals"
                className="mt-3 block w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-md"
              >
                View Full Network Tree
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. VIP CLUB MEMBERSHIP CALLOUT                                           */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-6 sm:p-10 shadow-xl shadow-amber-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
              <Crown className="w-4 h-4" />
              <span>FairKart VIP Club</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              Unlock 2X Fair Coins & Free Express Delivery
            </h3>
            <p className="text-xs sm:text-sm text-amber-100 leading-relaxed">
              Upgrade to the FairKart VIP Pass for exclusive discounts, priority support dispatch, and double coin cashbacks on every order.
            </p>
          </div>

          <Link
            to="/customer/subscription"
            className="px-6 py-3.5 rounded-2xl bg-white text-slate-900 hover:bg-amber-50 text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg transition-all shrink-0"
          >
            Upgrade to VIP Pass
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. WHY FAIRKART: THE FOUR PILLARS OF TRUST                               */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8 space-y-1">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900">Why India Shops on FairKart</h3>
          <p className="text-xs text-slate-500">Built from the ground up for transparency, security, and community wealth</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-slate-900">100% Escrow Security</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Buyer payments are safeguarded in platform escrow until package delivery is verified and accepted by you.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-inner">
              <Coins className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-slate-900">Real ₹1 Value per Coin</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every single Fair Coin earned represents ₹1.00 INR. Redeem at checkout without minimum order barriers.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-inner">
              <Truck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-slate-900">Certified Fast Logistics</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              State and taluk hub fulfillment ensure fast dispatches and real-time tracking straight to your doorstep.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-inner">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-slate-900">7-Day Hassle-Free Returns</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Doorstep pickup returns with prompt coin credits or immediate bank refunds on eligible marketplace items.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
