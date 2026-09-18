import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { QrCode, Store, ShieldAlert, Sparkles, RefreshCw, Trash2, Download, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const ShopQRCodeManager = () => {
  const [searchParams] = useSearchParams();
  const [shop, setShop] = useState(null);
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // If shopId passed in URL query, use it (for admins/franchises)
  const queryShopId = searchParams.get('shopId');

  useEffect(() => {
    loadShopAndQR();
  }, [queryShopId]);

  const loadShopAndQR = async () => {
    setLoading(true);
    setError(null);
    try {
      let targetShopId = queryShopId;

      if (!targetShopId) {
        const shopsRes = await api.get('/shops');
        const shops = shopsRes.data.data.shops || [];
        if (shops.length === 0) {
          setError('No shop profiles associated with your account.');
          setLoading(false);
          return;
        }
        targetShopId = shops[0]._id;
      }

      const shopRes = await api.get(`/shops/${targetShopId}`);
      const shopData = shopRes.data.data.shop;
      setShop(shopData);

      if (shopData.qrPublicToken) {
        const qrRes = await api.post(`/shops/${targetShopId}/qr`, { regenerate: false });
        setQr(qrRes.data.data.qr);
      } else {
        setQr(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load shop details or QR status');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (regenerate = false) => {
    if (!shop) return;
    if (
      regenerate &&
      !window.confirm(
        'Are you sure you want to regenerate the QR code? The previous QR code will be revoked immediately and cannot be scanned for new associations.'
      )
    ) {
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const qrRes = await api.post(`/shops/${shop._id}/qr`, { regenerate });
      setQr(qrRes.data.data.qr);
      const shopRes = await api.get(`/shops/${shop._id}`);
      setShop(shopRes.data.data.shop);
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (
      !shop ||
      !window.confirm(
        'Are you sure you want to revoke this QR code? New scans will fail. Existing customer attributions will NOT be changed.'
      )
    ) {
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      await api.put(`/shops/${shop._id}/qr/revoke`);
      setQr(null);
      const shopRes = await api.get(`/shops/${shop._id}`);
      setShop(shopRes.data.data.shop);
    } catch (err) {
      setError(err.response?.data?.message || 'Revocation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const clientUrl = window.location.origin;
  const joinUrl = qr ? `${clientUrl}/join/shop/${qr.publicToken}` : '';
  const qrImageUrl = qr
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(joinUrl)}&color=1e293b&bgcolor=ffffff`
    : '';

  const copyToClipboard = () => {
    if (!joinUrl) return;
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-slate-500 text-sm font-semibold">Loading shop QR configuration...</p>
      </div>
    );
  }

  if (error && !shop) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 mb-6 shadow-xs">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Notice</h2>
        <p className="text-slate-600 text-sm mb-6">{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200/80 p-6 sm:p-7 rounded-3xl shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <QrCode className="w-5 h-5" />
            </div>
            <span>Shop QR Attribution Identity</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage public store QR codes and permanent customer scan attribution links.
          </p>
        </div>
        <div className="bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-2xl flex items-center gap-2">
          <Store className="w-4 h-4 text-blue-600" />
          <span className="text-xs sm:text-sm text-slate-800 font-bold">{shop.shopName}</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-sm font-medium shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Left Side: QR Code Display Card */}
        <div className="md:col-span-2 flex flex-col items-center justify-center bg-white border border-slate-200/80 p-8 rounded-3xl text-center space-y-5 shadow-xs">
          {qr ? (
            <>
              <div className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
                ● Active Attribution QR
              </div>

              <div className="w-56 h-56 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-md mx-auto">
                <img src={qrImageUrl} alt="Shop QR Code" className="w-full h-full" />
              </div>

              <a
                href={qrImageUrl}
                target="_blank"
                rel="noreferrer"
                download={`Shop-QR-${shop.shopCode}.png`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download QR Code</span>
              </a>
            </>
          ) : (
            <>
              <div className="text-xs text-slate-500 font-bold bg-slate-100 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-wider">
                ○ No Active QR Code
              </div>

              <div className="w-56 h-56 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
                <QrCode className="w-12 h-12 stroke-[1.5]" />
                <span className="text-xs font-semibold">QR code not generated</span>
              </div>

              <button
                onClick={() => handleGenerate(false)}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                )}
                <span>Generate Shop QR</span>
              </button>
            </>
          )}
        </div>

        {/* Right Side: QR details & Actions */}
        <div className="md:col-span-3 space-y-6">
          {/* Shop Information Summary */}
          <div className="bg-white border border-slate-200/80 p-6 sm:p-7 rounded-3xl shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
              Shop Identity Details
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Store Name</p>
                <p className="font-bold text-slate-900 mt-0.5">{shop.shopName}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Shop Code</p>
                <p className="font-bold text-blue-600 font-mono mt-0.5">{shop.shopCode}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Territory (Taluk)</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {shop.taluk}, {shop.district}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">State / Pincode</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {shop.state} - {shop.pincode}
                </p>
              </div>
            </div>
          </div>

          {/* QR details & Actions */}
          {qr && (
            <div className="bg-white border border-slate-200/80 p-6 sm:p-7 rounded-3xl shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                Attribution Link & Controls
              </h3>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Public Scan Landing URL</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl">
                  <input
                    type="text"
                    readOnly
                    value={joinUrl}
                    className="w-full bg-transparent text-xs text-blue-700 font-mono font-medium px-2 focus:outline-none"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shrink-0 transition-all shadow-xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-3">
                <button
                  onClick={() => handleGenerate(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                  <span>Regenerate QR Code</span>
                </button>

                <button
                  onClick={handleRevoke}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Revoke QR Code</span>
                </button>
              </div>

              {/* Safety notice info */}
              <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3 text-slate-600 text-xs leading-relaxed">
                <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Revocation Policy:</strong> Revoking a QR code invalidates it immediately, preventing new
                  customer scans. Existing customers who were previously attributed remain permanently linked to your
                  shopkeeper profile.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ShopQRCodeManager;
