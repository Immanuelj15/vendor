import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { Store, MapPin, UserCheck, AlertTriangle, ArrowRight, Loader2, Sparkles, Phone, Mail, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export const ShopQRJoin = () => {
  const { publicToken } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [shopInfo, setShopInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attributing, setAttributing] = useState(false);
  const [attributionStatus, setAttributionStatus] = useState(null);

  useEffect(() => {
    fetchShopInfo();
  }, [publicToken]);

  const fetchShopInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/shops/qr/${publicToken}`);
      setShopInfo(response.data.data);

      if (isAuthenticated && user) {
        if (user.attributedShopId === response.data.data.shopId) {
          setAttributionStatus('success');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resolve QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleAssociate = async () => {
    if (!isAuthenticated) {
      navigate(`/register?shopQrToken=${publicToken}`);
      return;
    }

    setAttributing(true);
    try {
      const response = await api.post(`/shops/qr/${publicToken}/attribute`);
      const { attributed, reason } = response.data.data;

      if (attributed) {
        setAttributionStatus('success');
      } else if (reason === 'CUSTOMER_ALREADY_ATTRIBUTED') {
        setAttributionStatus('already_attributed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Attribution failed');
    } finally {
      setAttributing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-slate-500 text-sm font-medium">Resolving shop details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 border border-rose-200 mb-6 shadow-xs">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">QR Code Resolution Failed</h2>
        <p className="text-slate-600 text-sm mb-6">{error}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200/80 rounded-3xl p-7 sm:p-8 shadow-xs space-y-6 relative overflow-hidden"
      >
        {/* Header Branding */}
        <div className="text-center pb-5 border-b border-slate-100">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 mb-3.5 shadow-xs">
            <Store className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{shopInfo.shopName}</h2>
          <div className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-bold">
            <span>Shop Code: {shopInfo.shopCode}</span>
          </div>
        </div>

        {/* Shop Metadata Details */}
        <div className="bg-slate-50/70 rounded-2xl border border-slate-200/70 p-5 space-y-3.5">
          <div className="flex items-start gap-3.5 text-sm text-slate-700">
            <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Location Address</p>
              <p className="text-slate-600 mt-0.5 leading-relaxed text-xs sm:text-sm">
                {shopInfo.taluk}, {shopInfo.district}, {shopInfo.state} - {shopInfo.pincode}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 text-sm text-slate-700">
            <Phone className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Contact Number</p>
              <p className="text-slate-600 mt-0.5 text-xs sm:text-sm font-medium">{shopInfo.phone}</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 text-sm text-slate-700">
            <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Email Address</p>
              <p className="text-slate-600 mt-0.5 text-xs sm:text-sm font-medium">{shopInfo.email}</p>
            </div>
          </div>
        </div>

        {/* Dynamic Action Section */}
        <div className="space-y-4 pt-1">
          {attributionStatus === 'success' ? (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col items-center text-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Attribution Confirmed</div>
              <div className="text-base font-black text-slate-900">You are linked to this shopkeeper!</div>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                All your orders on FairKart directly support this verified local merchant.
              </p>
              <Link
                to="/products"
                className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
              >
                <span>Start Shopping</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : attributionStatus === 'already_attributed' ||
            (isAuthenticated && user?.attributedShopId && user.attributedShopId !== shopInfo.shopId) ? (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col items-center text-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">Permanent Association Notice</div>
              <div className="text-base font-black text-slate-900">Already Associated with Another Store</div>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Our policy ensures a permanent customer-to-shop relationship. You are already linked to another local partner.
              </p>
              <Link
                to="/products"
                className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
              >
                <span>Go to Marketplace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3.5">
              <button
                onClick={handleAssociate}
                disabled={attributing}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                {attributing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                    <span>{isAuthenticated ? 'Associate with this Shop' : 'Register & Associate with Shop'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {!isAuthenticated && (
                <div className="text-center text-xs text-slate-500">
                  Already have an account?{' '}
                  <Link to={`/login?redirect=/join/shop/${publicToken}`} className="text-blue-600 hover:underline font-bold">
                    Sign In First
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ShopQRJoin;
