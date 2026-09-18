import React from 'react';
import { ShoppingBag, ShieldCheck, RefreshCw, Award } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-500 text-sm mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-slate-900">FairKart</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Next-generation multi-vendor e-commerce platform powered by transparent MLM referral networks, Fair Coins rewards, and daily spin wheels.
            </p>
            <div className="text-xs font-bold text-blue-600">
              Shop • Earn • Refer • Win
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Ecosystem</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-blue-600 transition-colors">Multi-Vendor Marketplace</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Fair Coins Ledger</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Multi-Level Referral Hierarchy</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Spin & Win Rewards</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Vendors & Partners</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-blue-600 transition-colors">Become a Vendor</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Vendor Dashboard</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Commission Policy</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Withdrawal Rules</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Trust & Security</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Verified Vendor Products</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-600" />
                <span>Audited Referral Ledger</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Fair Coins Reward Policy</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 text-center text-xs text-slate-400">
          <p>© 2026 FairKart Marketplace Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
