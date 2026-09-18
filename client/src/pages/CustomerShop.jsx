import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { Store, MapPin, Phone, Mail, Calendar, Loader2, Sparkles, ShoppingBag, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export const CustomerShop = () => {
  const { user } = useSelector((state) => state.auth);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAttributedShop();
  }, [user]);

  const fetchAttributedShop = async () => {
    if (!user || !user.attributedShopId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/shops/${user.attributedShopId}`);
      setShop(response.data.data.shop);
    } catch (err) {
      setError('Could not fetch associated shop details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-slate-600 text-sm font-medium">Loading your associated shop details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Store className="w-5 h-5" />
          </div>
          <span>My Associated Shop</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1.5">
          Your orders support your permanently attributed local shopkeeper partner.
        </p>
      </div>

      {user && user.attributedShopId && shop ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 relative overflow-hidden"
        >
          {/* Shop Header */}
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{shop.shopName}</h2>
              <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-bold">
                <span>Code: {shop.shopCode}</span>
              </div>
            </div>
          </div>

          {/* Details List */}
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <MapPin className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-slate-900">Shop Address</p>
                <p className="text-slate-600 mt-0.5 leading-relaxed">
                  {shop.address}, {shop.taluk}, {shop.district}, {shop.state} - {shop.pincode}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <Phone className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-slate-900">Phone Number</p>
                <p className="text-slate-600 mt-0.5 font-medium">{shop.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-slate-900">Email Address</p>
                <p className="text-slate-600 mt-0.5 font-medium">{shop.email}</p>
              </div>
            </div>
          </div>

          {/* Badge Info */}
          <div className="p-4 bg-blue-50 border border-blue-200/80 rounded-2xl flex items-center gap-3 text-sm text-blue-800 font-medium">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
            <span>Permanent partner association is locked and confirmed.</span>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200/80 rounded-3xl p-10 text-center space-y-5 shadow-xs"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 border border-blue-100">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">No Shop Associated</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Scan a partner shop's QR code to link your account. Once linked, you will support this shopkeeper with your everyday purchases.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};
