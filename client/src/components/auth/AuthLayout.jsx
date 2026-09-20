import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles, Gift, Zap } from 'lucide-react';

export const AuthLayout = ({
  children,
  badge = 'FairKart E-Commerce',
  title = 'Shop, Earn & Grow',
  subtitle = 'India’s multi-vendor platform with 9-level referral rewards and Fair Coins.',
  imageSrc = '/images/customer-auth.jpg',
  imageAlt = 'FairKart Shopping Experience',
  features = [
    { icon: Gift, text: 'Spin & Win Fair Coins every checkout' },
    { icon: Zap, text: 'Instant 9-Level MLM Referral network' },
    { icon: ShieldCheck, text: '100% verified & encrypted payment escrow' },
  ],
  theme = 'blue', // 'blue' | 'emerald' | 'slate'
}) => {
  const glowColors = {
    blue: 'bg-blue-500/15',
    emerald: 'bg-emerald-500/15',
    slate: 'bg-indigo-500/15',
  }[theme] || 'bg-blue-500/15';

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/60 overflow-hidden">
      {/* 1. Small Grid Box Pattern Layer */}
      <div className="absolute inset-0 bg-grid-pattern radial-fade-mask opacity-85 pointer-events-none" />

      {/* 2. Ambient Floating Glowing Orbs */}
      <div
        className={`absolute -top-32 -left-32 w-96 h-96 ${glowColors} rounded-full blur-3xl pointer-events-none animate-pulse-glow`}
      />
      <div
        className={`absolute -bottom-32 -right-32 w-96 h-96 ${glowColors} rounded-full blur-3xl pointer-events-none animate-pulse-glow`}
        style={{ animationDelay: '2.5s' }}
      />
      <div
        className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-float-reverse"
      />

      {/* 3. Floating Decorative Micro-Badges */}
      <div className="hidden xl:block absolute top-20 left-16 animate-float-slow pointer-events-none">
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-lg shadow-blue-500/5 text-xs font-bold text-slate-800">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span>Fair Coins Live Rewards</span>
        </div>
      </div>

      <div className="hidden xl:block absolute bottom-24 left-24 animate-float-reverse pointer-events-none">
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-lg shadow-blue-500/5 text-xs font-bold text-slate-800">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>9-Level Referral Network</span>
        </div>
      </div>

      {/* 4. Main Responsive Content Container */}
      <div className="relative w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-14 z-10">
        {/* Left Side: 3D Visual Hero (Visible on large screens) */}
        {imageSrc && (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="hidden lg:flex flex-1 flex-col items-start max-w-md xl:max-w-lg"
          >
            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{badge}</span>
            </div>

            <h1 className="text-3xl xl:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-3">
              {title}
            </h1>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {subtitle}
            </p>

            {/* 3D Illustration Container with Glass Floating Border */}
            <div className="relative w-full rounded-3xl overflow-hidden p-2 bg-gradient-to-b from-white/80 via-white/50 to-blue-50/50 border border-slate-200/90 shadow-2xl shadow-blue-900/10 mb-6">
              <div className="relative rounded-2xl overflow-hidden bg-slate-900/5 aspect-square">
                <img
                  src={imageSrc}
                  alt={imageAlt}
                  className="w-full h-full object-cover rounded-2xl hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
                
                {/* Floating pill over image */}
                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-white/90 backdrop-blur-md border border-white/60 shadow-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                      FK
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">FairKart Verified</div>
                      <div className="text-[10px] text-slate-500">Escrow & Double-Entry Ledger</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Feature Bullets */}
            <div className="grid grid-cols-1 gap-2.5 w-full">
              {features.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/70 border border-slate-200/60 shadow-xs text-xs font-semibold text-slate-700"
                  >
                    <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span>{item.text}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Right Side: Auth Card Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full flex justify-center flex-1 max-w-md"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
