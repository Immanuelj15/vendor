import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Loader2, Landmark, CheckCircle, FileText, CreditCard, Shield, HelpCircle, Store } from 'lucide-react';
import { motion } from 'framer-motion';

export const ShopkeeperDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [shopkeeper, setShopkeeper] = useState(null);
  const [shop, setShop] = useState(null);
  const [plans, setPlans] = useState([]);
  const [onboardingStep, setOnboardingStep] = useState(1);

  // Forms states
  const [shopForm, setShopForm] = useState({
    shopName: '',
    address: '',
    state: '',
    district: '',
    taluk: '',
    pincode: '',
    phone: '',
    email: '',
  });

  const [kycForm, setKycForm] = useState({
    documentType: 'PAN',
    documentNumber: '',
    documentUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const skRes = await api.get('/shopkeepers');
      if (skRes.data.data.shopkeepers?.length > 0) {
        const sk = skRes.data.data.shopkeepers[0];
        setShopkeeper(sk);

        if (sk.onboardingStatus === 'PENDING') setOnboardingStep(2);
        else if (sk.onboardingStatus === 'KYC_SUBMITTED') setOnboardingStep(3);
        else if (sk.onboardingStatus === 'KYC_APPROVED') setOnboardingStep(4);
        else if (sk.onboardingStatus === 'SUBSCRIBED') setOnboardingStep(5);
        else if (sk.onboardingStatus === 'APPROVED') {
          setOnboardingStep(6);
          const shRes = await api.get('/shops');
          if (shRes.data.data.shops?.length > 0) {
            setShop(shRes.data.data.shops[0]);
          }
        }
      } else {
        setOnboardingStep(1);
      }

      const pRes = await api.get('/subscriptions/plans');
      setPlans(pRes.data.data.plans || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/kyc', {
        entityType: 'SHOPKEEPER',
        entityId: shopkeeper._id,
        ...kycForm,
      });
      alert('KYC Document submitted successfully!');
      fetchProfile();
    } catch (err) {
      alert(err.response?.data?.message || 'KYC submission failed');
    }
  };

  const handleSubscribe = async (planId) => {
    try {
      await api.post('/subscriptions', {
        planId,
        entityType: 'SHOPKEEPER',
        entityId: shopkeeper._id,
        paymentId: 'pay_test_dummy_sub',
      });
      alert('Subscription activated successfully!');
      fetchProfile();
    } catch (err) {
      alert(err.response?.data?.message || 'Subscription failed');
    }
  };

  const handleCreateShop = async (e) => {
    e.preventDefault();
    try {
      await api.post('/shops', {
        shopkeeperId: shopkeeper._id,
        talukFranchiseId: shopkeeper.talukFranchiseId,
        ...shopForm,
      });
      alert('Shop details registered! Redirecting to shop activation.');
      fetchProfile();
    } catch (err) {
      alert(err.response?.data?.message || 'Shop registration failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Loading shopkeeper workspace...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 py-10 space-y-8"
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Landmark className="w-5 h-5" />
          </div>
          <span>Shopkeeper Portal & Operations</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Complete KYC verification, active plans, and govern your storefront attribution QR token.
        </p>
      </div>

      {/* Onboarding Wizard Indicators */}
      {onboardingStep < 6 && (
        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs space-y-3.5">
          <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Onboarding Checklist</h3>
          <div className="grid grid-cols-5 gap-2 text-center text-xs font-bold">
            <div
              className={`p-2.5 rounded-xl border ${
                onboardingStep >= 2
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}
            >
              1. Profile
            </div>
            <div
              className={`p-2.5 rounded-xl border ${
                onboardingStep >= 3
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}
            >
              2. KYC Submit
            </div>
            <div
              className={`p-2.5 rounded-xl border ${
                onboardingStep >= 4
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}
            >
              3. Verification
            </div>
            <div
              className={`p-2.5 rounded-xl border ${
                onboardingStep >= 5
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}
            >
              4. Subscription
            </div>
            <div
              className={`p-2.5 rounded-xl border ${
                onboardingStep >= 6
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}
            >
              5. Setup
            </div>
          </div>
        </div>
      )}

      {/* Step Panels */}
      {onboardingStep === 1 && (
        <div className="bg-white border border-slate-200/80 p-10 rounded-3xl text-center space-y-4 shadow-xs">
          <HelpCircle className="w-14 h-14 text-slate-400 mx-auto" />
          <h2 className="text-xl font-black text-slate-900">Not Registered as Shopkeeper</h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
            Your login account is not currently associated with an active retail shopkeeper profile.
            Please reach out to your local Taluk Franchise operator to initiate your onboarding.
          </p>
        </div>
      )}

      {onboardingStep === 2 && (
        <form onSubmit={handleKycSubmit} className="bg-white border border-slate-200/80 p-7 rounded-3xl space-y-4 shadow-xs">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Step 2: Submit KYC Documents</span>
          </h3>

          <div className="space-y-3">
            <select
              value={kycForm.documentType}
              onChange={(e) => setKycForm({ ...kycForm, documentType: e.target.value })}
              className="w-full bg-slate-50 text-sm text-slate-900 rounded-xl px-4 py-3 border border-slate-200 focus:outline-none focus:border-blue-600 font-medium"
            >
              <option value="PAN">PAN Card</option>
              <option value="AADHAAR">Aadhaar Card</option>
              <option value="GST">GST Certificate</option>
              <option value="TRADE_LICENSE">Trade License</option>
            </select>

            <input
              type="text"
              placeholder="Document ID Number"
              required
              value={kycForm.documentNumber}
              onChange={(e) => setKycForm({ ...kycForm, documentNumber: e.target.value })}
              className="w-full bg-slate-50 text-sm text-slate-900 rounded-xl px-4 py-3 border border-slate-200 focus:outline-none focus:border-blue-600 font-medium"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all"
          >
            Submit Documents
          </button>
        </form>
      )}

      {onboardingStep === 3 && (
        <div className="bg-white border border-slate-200/80 p-10 rounded-3xl text-center space-y-4 shadow-xs">
          <Shield className="w-14 h-14 text-amber-500 mx-auto" />
          <h2 className="text-xl font-black text-slate-900">KYC Documents Under Review</h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
            We have received your verification documents. The platform administrators are currently reviewing them.
            Once approved, you will proceed to the subscription plans.
          </p>
        </div>
      )}

      {onboardingStep === 4 && (
        <div className="bg-white border border-slate-200/80 p-7 rounded-3xl space-y-6 shadow-xs">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span>Step 4: Choose Shopkeeper Plan</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {plans.map((p) => (
              <div
                key={p._id}
                className="bg-slate-50 border border-slate-200/80 p-6 rounded-2xl flex flex-col justify-between space-y-4"
              >
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 text-lg">{p.name}</div>
                  <div className="text-slate-600 text-xs sm:text-sm">{p.description}</div>
                  <div className="text-3xl font-black text-blue-600 pt-2">₹{p.price}</div>
                </div>
                <button
                  onClick={() => handleSubscribe(p._id)}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all"
                >
                  Subscribe Plan
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {onboardingStep === 5 && (
        <form onSubmit={handleCreateShop} className="bg-white border border-slate-200/80 p-7 rounded-3xl space-y-4 shadow-xs">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Landmark className="w-5 h-5 text-blue-600" />
            <span>Step 5: Setup Your Shop Profile</span>
          </h3>

          <div className="space-y-3.5">
            <input
              type="text"
              placeholder="Shop Name"
              required
              value={shopForm.shopName}
              onChange={(e) => setShopForm({ ...shopForm, shopName: e.target.value })}
              className="w-full bg-slate-50 text-sm text-slate-900 rounded-xl px-4 py-3 border border-slate-200 focus:outline-none focus:border-blue-600 font-medium"
            />
            <input
              type="text"
              placeholder="Full Physical Address"
              required
              value={shopForm.address}
              onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
              className="w-full bg-slate-50 text-sm text-slate-900 rounded-xl px-4 py-3 border border-slate-200 focus:outline-none focus:border-blue-600 font-medium"
            />
            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="State"
                required
                value={shopForm.state}
                onChange={(e) => setShopForm({ ...shopForm, state: e.target.value })}
                className="w-full bg-slate-50 text-sm text-slate-900 rounded-xl px-3 py-3 border border-slate-200 focus:outline-none focus:border-blue-600 font-medium"
              />
              <input
                type="text"
                placeholder="District"
                required
                value={shopForm.district}
                onChange={(e) => setShopForm({ ...shopForm, district: e.target.value })}
                className="w-full bg-slate-50 text-sm text-slate-900 rounded-xl px-3 py-3 border border-slate-200 focus:outline-none focus:border-blue-600 font-medium"
              />
              <input
                type="text"
                placeholder="Taluk"
                required
                value={shopForm.taluk}
                onChange={(e) => setShopForm({ ...shopForm, taluk: e.target.value })}
                className="w-full bg-slate-50 text-sm text-slate-900 rounded-xl px-3 py-3 border border-slate-200 focus:outline-none focus:border-blue-600 font-medium"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="PIN Code"
                required
                value={shopForm.pincode}
                onChange={(e) => setShopForm({ ...shopForm, pincode: e.target.value })}
                className="w-full bg-slate-50 text-sm text-slate-900 rounded-xl px-3 py-3 border border-slate-200 focus:outline-none focus:border-blue-600 font-medium"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                required
                value={shopForm.phone}
                onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                className="w-full bg-slate-50 text-sm text-slate-900 rounded-xl px-3 py-3 border border-slate-200 focus:outline-none focus:border-blue-600 font-medium"
              />
              <input
                type="email"
                placeholder="Contact Email"
                required
                value={shopForm.email}
                onChange={(e) => setShopForm({ ...shopForm, email: e.target.value })}
                className="w-full bg-slate-50 text-sm text-slate-900 rounded-xl px-3 py-3 border border-slate-200 focus:outline-none focus:border-blue-600 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all"
          >
            Create Shop Profile
          </button>
        </form>
      )}

      {onboardingStep === 6 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200/80 p-6 sm:p-7 rounded-3xl shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Store className="w-5 h-5 text-blue-600" />
              <span>Shop Profile Details</span>
            </h3>

            <div className="space-y-2.5 text-sm text-slate-700">
              <div>
                <span className="font-bold text-slate-900">Shop Code:</span>{' '}
                <span className="font-mono text-blue-600 font-bold">{shop?.shopCode}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900">Shop Name:</span> {shop?.shopName}
              </div>
              <div>
                <span className="font-bold text-slate-900">Territory:</span> {shop?.taluk}, {shop?.district} (
                {shop?.pincode})
              </div>
              <div>
                <span className="font-bold text-slate-900">Contact:</span> {shop?.phone} | {shop?.email}
              </div>
              <div className="pt-2">
                <span className="font-bold text-slate-900">Status:</span>{' '}
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {shop?.status || 'ACTIVE'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-6 sm:p-7 rounded-3xl shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>QR Foundation Identity</span>
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm">
                Your shop is active and fully credentialed. The secure unique public QR token is generated below.
              </p>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl font-mono text-xs text-blue-700 break-all select-all font-bold">
                {shop?.qrPublicToken}
              </div>
            </div>

            <div className="text-xs text-slate-500 border-t border-slate-100 pt-3">
              Customer attribution and direct shopkeeper referral commissions bind automatically to this QR token.
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ShopkeeperDashboard;
