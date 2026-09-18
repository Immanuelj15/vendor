import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ShoppingBag, Coins, Dices, Users, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const Home = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50/70 via-white to-slate-50 border-b border-blue-100/60">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold mb-6 text-blue-700 shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Next-Gen Multi-Vendor Marketplace & Rewards</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto"
          >
            Shop verified products. <br />
            <span className="blue-gradient-text">Earn Fair Coins.</span> Refer & Win.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed"
          >
            FairKart combines a multi-vendor marketplace with transparent 9-level referral rewards, an immutable Fair Coins ledger, and interactive Spin & Win daily rewards.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 flex flex-wrap justify-center gap-4"
          >
            {isAuthenticated ? (
              <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
                  <Coins className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold">Your Referral Code</div>
                  <div className="text-lg font-mono font-bold text-slate-900 tracking-wider">
                    {user?.referralCode || 'FAIRKART'}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/register"
                    className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all"
                  >
                    <span>Start Referral Engine</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
                <Link
                  to="/login"
                  className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm shadow-xs transition-all"
                >
                  Login to Account
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:border-blue-200 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-4">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Multi-Vendor Marketplace</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Curated vendor storefronts, split order fulfillment, and automated vendor commission ledger.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:border-blue-200 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center mb-4">
              <Coins className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Fair Coins Ledger</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Immutable reward ledger tracking credits, debits, referral bonuses, and checkout redemptions.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:border-blue-200 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">9-Level Referral Tree</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Transparent multi-level referral hierarchy with automated upline commission distributions.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:border-blue-200 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
              <Dices className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Spin & Win Rewards</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Backend-weighted reward calculation engine powering interactive spin wheel campaigns.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
