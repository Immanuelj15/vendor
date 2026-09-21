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
  Smartphone,
  Flame,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORY_CARDS = [
  { name: 'Electronics', slug: 'electronics-gadgets', icon: Laptop, color: 'from-blue-500 to-indigo-600', count: '140+ Items' },
  { name: 'Fashion & Apparel', slug: 'fashion-apparel', icon: Shirt, color: 'from-purple-500 to-pink-600', count: '120+ Items' },
  { name: 'Home & Kitchen', slug: 'home-kitchen', icon: HomeIcon, color: 'from-amber-500 to-orange-600', count: '85+ Items' },
  { name: 'Beauty & Grooming', slug: 'beauty-personal-care', icon: Sparkle, color: 'from-rose-500 to-pink-500', count: '60+ Items' },
  { name: 'Watches & Wearables', slug: 'watches-wearables', icon: Watch, color: 'from-teal-500 to-emerald-600', count: '50+ Items' },
  { name: 'Audio & Sound', slug: 'audio-sound', icon: HeadphonesIcon, color: 'from-sky-500 to-blue-600', count: '45+ Items' },
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

  useEffect(() => {
    fetchFeaturedProducts();
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated]);

  const fetchFeaturedProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await api.get('/products', { params: { limit: 8, sort: 'rating' } });
      setFeaturedProducts(res.data.data.products || []);
    } catch (err) {
      console.error('Failed to load featured products for home page', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/wishlist');
      if (res.data?.success && res.data.data.wishlist) {
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
      if (res.data?.success && res.data.data.wishlist) {
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
    if (activeTab === 'deals') return p.mrp > p.price || p.discountPrice > 0;
    if (activeTab === 'highRating') return (p.rating || 4.5) >= 4.5;
    return true;
  });

  return (
    <div className="space-y-12 pb-16">
      {/* 1. HERO SHOWCASE WITH SEARCH & STATS */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white p-6 sm:p-12 lg:p-16 shadow-2xl shadow-blue-950/20 m-4 sm:m-6 lg:m-8">
        {/* Glow ambient effects */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-blue-200 uppercase tracking-wider"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Mega Marketplace Savings • 100% Escrow Verified</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight"
          >
            Shop Verified Products.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300">
              Earn Fair Coins.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed"
          >
            Explore 500+ verified brand products, earn guaranteed Fair Coins on every order, and unlock 9-level referral commissions.
          </motion.p>

          {/* Quick Search Form */}
          <motion.form
            onSubmit={handleSearchSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative max-w-2xl mx-auto pt-2"
          >
            <div className="relative flex items-center shadow-2xl rounded-2xl overflow-hidden bg-white">
              <Search className="absolute left-4 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands (Apple, Samsung, Nike, Sony)..."
                className="w-full pl-12 pr-28 py-3.5 sm:py-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md"
              >
                Search
              </button>
            </div>

            {/* Trending Keyword Pills */}
            <div className="flex items-center justify-center gap-2 flex-wrap pt-3 text-[11px] text-slate-400">
              <span className="font-bold text-slate-300">Popular:</span>
              {['Smartphones', 'Laptops', 'Watches', 'Sneakers', 'Headphones'].map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => navigate(`/products?search=${encodeURIComponent(kw)}`)}
                  className="px-2.5 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
                >
                  {kw}
                </button>
              ))}
            </div>
          </motion.form>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
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
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2"
            >
              <Dices className="w-4 h-4 text-amber-400" />
              <span>Spin & Win Coins</span>
            </Link>
          </div>

          {/* Trust Value Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/10 text-slate-300 text-xs">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Escrow Verified</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Coins className="w-4 h-4 text-amber-400 shrink-0" />
              <span>100% Cashable Coins</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Truck className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Fast Hub Dispatch</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4 text-purple-400 shrink-0" />
              <span>7-Day Easy Returns</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TOP CATEGORIES BROWSER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Shop by Category</h2>
            <p className="text-xs text-slate-500 mt-0.5">Explore popular collections across verified merchants</p>
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
                className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-4 hover:border-blue-300 hover:shadow-md transition-all flex flex-col items-center text-center space-y-2"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                  {cat.name}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold">{cat.count}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Featured Marketplace Picks</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Hand-picked verified deals with the highest coin rewards</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setActiveTab('deals')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'deals'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Flash Deals
            </button>
            <button
              onClick={() => setActiveTab('highRating')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'highRating'
                  ? 'bg-blue-600 text-white shadow-xs'
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
            <p className="font-bold text-sm text-slate-800">No featured products currently in this view</p>
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
                  className="group bg-white border border-slate-200/80 hover:border-blue-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
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
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>

                      {/* Wishlist Button */}
                      <button
                        onClick={() => handleToggleWishlist(prod._id)}
                        className="absolute top-3 left-3 p-2 rounded-full bg-white/90 hover:bg-white border border-slate-200 shadow-xs text-slate-600 transition-colors z-10"
                        title="Wishlist"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            wishlistProductIds.includes(prod._id) ? 'text-rose-500 fill-rose-500' : 'text-slate-400'
                          }`}
                        />
                      </button>

                      {/* Discount or Coin Badge */}
                      <div className="absolute top-3 right-3 flex flex-col items-end gap-1 z-10">
                        {discountPct > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                            {discountPct}% OFF
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold flex items-center gap-1 shadow-xs">
                          <Coins className="w-3 h-3 text-amber-500" />
                          <span>+{prod.coinReward || 15}</span>
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
                        <span className="font-semibold truncate max-w-[120px]">{prod.brand || 'FairTech'}</span>
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{prod.rating ? prod.rating.toFixed(1) : '4.8'}</span>
                        </div>
                      </div>

                      <Link
                        to={`/products/${prod.slug || prod._id}`}
                        className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 block"
                      >
                        {prod.name}
                      </Link>

                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-base font-black text-slate-900">₹{prod.price}</span>
                        {hasDiscount && prod.mrp && (
                          <span className="text-xs text-slate-400 line-through">₹{prod.mrp}</span>
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
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
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

      {/* 4. REWARDS & COMMUNITY GROWTH CARDS (SPIN & WIN + 9-LEVEL REFERRAL) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Spin & Win Daily */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white p-6 sm:p-8 shadow-xl shadow-indigo-900/10 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-amber-300">
                <Dices className="w-4 h-4" />
                <span>Daily Free Reward</span>
              </div>
              <h3 className="text-2xl font-black tracking-tight">
                Spin & Win Guaranteed Fair Coins
              </h3>
              <p className="text-xs text-indigo-100 leading-relaxed max-w-md">
                Every verified customer gets a free daily turn on the FairKart Lucky Wheel. Win up to 500 Fair Coins, VIP day passes, and discount coupons.
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/customer/rewards"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-400/20"
              >
                <span>Play Lucky Wheel</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: 9-Level Referral Network */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white p-6 sm:p-8 shadow-xl shadow-blue-900/10 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-blue-200">
                <Users className="w-4 h-4" />
                <span>Earn While Friends Shop</span>
              </div>
              <h3 className="text-2xl font-black tracking-tight">
                9-Level Automated Referral Network
              </h3>
              <p className="text-xs text-blue-100 leading-relaxed max-w-md">
                Invite friends with your unique code. Whenever anyone in your 9-tier upline or downline purchases a product, you receive direct coin commissions!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {isAuthenticated ? (
                <div className="flex items-center gap-2 bg-white/15 border border-white/20 px-3.5 py-2 rounded-xl backdrop-blur-md">
                  <span className="text-xs text-blue-200 font-semibold">Your Code:</span>
                  <span className="font-mono font-black text-sm text-white tracking-wider">
                    {user?.referralCode || 'FAIRKART'}
                  </span>
                  <button
                    onClick={copyReferralCode}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors ml-1"
                    title="Copy Code"
                  >
                    {copiedReferral ? (
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-white" />
                    )}
                  </button>
                </div>
              ) : null}

              <Link
                to="/customer/referrals"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-blue-50 text-blue-900 text-xs font-black uppercase tracking-wider transition-all shadow-md"
              >
                <span>View Network Tree</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. VIP PASS & CONCIERGE PROMO */}
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

      {/* 6. WHY SHOP ON FAIRKART PILLARS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-slate-900">Escrow Security</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Payments are held safely in platform escrow until you receive and verify your ordered items.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Coins className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-slate-900">100% Real Value Coins</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              1 Fair Coin is always equal to ₹1.00 INR. Redeem seamlessly at checkout with zero arbitrary rules.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Truck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-slate-900">Verified Dispatch</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Regional fulfillment centers and verified merchant warehouses ensure quick doorstep arrival.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-slate-900">Hassle-Free Returns</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              7-day doorstep pickup and immediate coin or bank account refunds on eligible marketplace products.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
