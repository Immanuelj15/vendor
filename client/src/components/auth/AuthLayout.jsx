import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles, Gift, Zap, Share2, Coins } from 'lucide-react';

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
    <div className="relative min-h-[90vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-50/70 overflow-hidden">
      {/* 1. Subtle High-Precision Small Grid Box Background */}
      <div className="absolute inset-0 bg-grid-pattern radial-fade-mask opacity-85 pointer-events-none" />

      {/* 2. Ambient Floating Glowing Halos */}
      <div
        className={`absolute -top-32 -left-32 w-96 h-96 ${glowColors} rounded-full blur-3xl pointer-events-none animate-pulse-glow`}
      />
      <div
        className={`absolute -bottom-32 -right-32 w-96 h-96 ${glowColors} rounded-full blur-3xl pointer-events-none animate-pulse-glow`}
        style={{ animationDelay: '2.5s' }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />

      {/* 3. Main Centered Responsive Content Container */}
      <div className="relative w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-14 z-10 my-auto">
        {/* Left Column: 3D Artwork Hero & Integrated Floating Badges */}
        {imageSrc && (
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="hidden lg:flex flex-1 flex-col items-start max-w-md xl:max-w-lg"
          >
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100/80 border border-blue-200/80 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{badge}</span>
            </div>

            <h1 className="text-3xl xl:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-2.5">
              {title}
            </h1>
            <p className="text-xs xl:text-sm text-slate-600 mb-6 leading-relaxed">
              {subtitle}
            </p>

            {/* 3D Illustration Container with Attached Floating Badges */}
            <div className="relative w-full my-2">
              {/* Floating Badge 1: Fair Coins Live Rewards (Top-Left Accent) */}
              <div className="absolute -top-5 -left-4 z-20 animate-float-slow">
                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-amber-200/90 shadow-xl shadow-amber-500/10 hover:shadow-amber-500/20 transition-shadow">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white flex items-center justify-center font-black text-sm shadow-md shadow-amber-500/30">
                    <Coins className="w-5 h-5 text-amber-950 fill-amber-200" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-xs font-black text-slate-900 leading-tight">Fair Coins Rewards</span>
                    </div>
                    <div className="text-[11px] font-bold text-amber-600 leading-tight mt-0.5">
                      +100 Coins on Signup
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badge 2: 9-Level Referral Network (Bottom-Right Accent) */}
              <div className="absolute -bottom-5 -right-4 z-20 animate-float-reverse">
                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-blue-200/90 shadow-xl shadow-blue-600/10 hover:shadow-blue-600/20 transition-shadow">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30">
                    <Share2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      <span className="text-xs font-black text-slate-900 leading-tight">9-Level Referral</span>
                    </div>
                    <div className="text-[11px] font-bold text-blue-600 leading-tight mt-0.5">
                      Upline Team Network
                    </div>
                  </div>
                </div>
              </div>

              {/* Central Framed Artwork */}
              <div className="relative w-full rounded-3xl p-2 bg-gradient-to-b from-white/90 via-white/70 to-blue-50/50 border border-slate-200/80 shadow-2xl shadow-blue-900/10 overflow-hidden">
                <div className="relative rounded-2xl overflow-hidden bg-slate-900/5 aspect-square">
                  <img
                    src={imageSrc}
                    alt={imageAlt}
                    className="w-full h-full object-cover rounded-2xl hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />

                  {/* Trust Pill at bottom inside image */}
                  <div className="absolute bottom-3.5 left-3.5 right-3.5 p-2.5 rounded-xl bg-white/90 backdrop-blur-md border border-white/70 shadow-md flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                        FK
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">FairKart Verified Platform</div>
                        <div className="text-[10px] text-slate-500">Escrow Protected & Encrypted Payouts</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                      100% SECURE
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Bullets Below Artwork */}
            <div className="grid grid-cols-1 gap-2 w-full mt-4">
              {features.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/85 border border-slate-200/70 shadow-xs text-xs font-medium text-slate-700 hover:bg-white transition-colors"
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

        {/* Right Column: Interactive Card Form */}
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
