import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AccountSidebar } from '../components/AccountSidebar';
import api from '../services/api';
import { fetchCurrentUser, updateCoinBalance } from '../store/authSlice';
import {
  Crown,
  CheckCircle2,
  Sparkles,
  Coins,
  ShieldCheck,
  Zap,
  Calendar,
  Loader2,
  AlertCircle,
  CreditCard,
  Check,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const CustomerSubscription = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected plan for checkout
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Mock dev test payment modal
  const [showMockModal, setShowMockModal] = useState(false);
  const [mockPaymentData, setMockPaymentData] = useState(null);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    setLoading(true);
    try {
      const [plansRes, statusRes, historyRes] = await Promise.all([
        api.get('/customer/premium/plans').catch(() => ({ data: { data: { plans: [] } } })),
        api.get('/customer/premium').catch(() => ({ data: { data: { isPremium: false, subscription: null } } })),
        api.get('/customer/premium/history').catch(() => ({ data: { data: { history: [] } } })),
      ]);

      const loadedPlans = plansRes.data?.data?.plans || [];
      setPlans(loadedPlans);
      if (loadedPlans.length > 0) {
        setSelectedPlanId(loadedPlans[0]._id);
      }

      setIsPremium(statusRes.data?.data?.isPremium || false);
      setCurrentSub(statusRes.data?.data?.subscription || null);
      setHistory(historyRes.data?.data?.history || []);
    } catch (e) {
      console.error('Failed to load subscription data:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleVerifyPayment = async (verificationPayload) => {
    try {
      const verifyRes = await api.post('/customer/premium/verify-payment', verificationPayload);
      if (verifyRes.data?.success) {
        setMessage('Subscription successfully activated! Bonus coins have been credited to your wallet.');
        dispatch(fetchCurrentUser());
        fetchSubscriptionData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment verification failed');
    } finally {
      setSubscribing(false);
      setShowMockModal(false);
    }
  };

  const handleSubscribe = async (planId) => {
    const targetPlan = plans.find((p) => p._id === planId);
    if (!targetPlan) return;

    setSubscribing(true);
    setError('');
    setMessage('');

    try {
      const orderRes = await api.post('/customer/premium/subscribe', { planId });
      const paymentData = orderRes.data?.data;

      if (!paymentData) {
        throw new Error('Could not initiate payment order');
      }

      // Check if Razorpay test mode or mock
      if (paymentData.mode === 'MOCK' || !paymentData.keyId) {
        setMockPaymentData(paymentData);
        setShowMockModal(true);
        setSubscribing(false);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setMockPaymentData(paymentData);
        setShowMockModal(true);
        setSubscribing(false);
        return;
      }

      const options = {
        key: paymentData.keyId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: 'FairKart Premium Membership',
        description: `${targetPlan.name} Subscription`,
        order_id: paymentData.razorpayOrderId,
        handler: async function (response) {
          await handleVerifyPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone,
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: function () {
            setError('Payment cancelled.');
            setSubscribing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setError(`Payment Failed: ${resp.error?.description || 'Transaction unsuccessful'}`);
        setSubscribing(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create subscription');
      setSubscribing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <AccountSidebar />

        <div className="flex-1 bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-xs space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <Crown className="w-6 h-6 text-amber-500" />
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">FairKart VIP Premium Membership</h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">Unlock exclusive multiplier coin rewards, daily spin perks, and special discounts</p>
            </div>

            {isPremium && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 border border-amber-200 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-xs">
                <Crown className="w-4 h-4 text-amber-600" />
                <span>Active VIP Member</span>
              </div>
            )}
          </div>

          {/* Messages */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{message}</span>
            </motion.div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Active Subscription Banner */}
          {currentSub && isPremium && (
            <div className="bg-gradient-to-br from-amber-50 via-blue-50/40 to-white border border-amber-200/80 p-6 rounded-3xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-lg text-slate-900">{currentSub.planId?.name || currentSub.planSnapshot?.name}</h3>
                  <p className="text-xs text-emerald-600 font-bold mt-0.5">Status: ACTIVE VIP</p>
                </div>
                <span className="text-2xl font-black text-slate-900">₹{currentSub.planId?.price || currentSub.planSnapshot?.price}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 pt-3 border-t border-slate-200/70">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Started: {new Date(currentSub.startedAt || currentSub.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                </div>
                <div className="flex items-center gap-2 text-amber-700 font-bold">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Expires: {new Date(currentSub.expiresAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                </div>
              </div>
            </div>
          )}

          {/* Available Subscription Plans Cards */}
          <div className="space-y-4">
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span>Available Membership Billing Cycles</span>
            </h3>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-64 bg-slate-100 rounded-2xl" />
                ))}
              </div>
            ) : plans.length === 0 ? (
              <p className="text-xs text-slate-500">No active plans configured.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.map((plan) => {
                  const isSelected = selectedPlanId === plan._id;
                  const bonusCoins = plan.rewardRules?.coinsOnSubscribe || 0;
                  const bonusSuperCoins = plan.rewardRules?.superCoinsOnSubscribe || 0;

                  return (
                    <motion.div
                      key={plan._id}
                      whileHover={{ y: -3 }}
                      className={`p-6 rounded-3xl border flex flex-col justify-between transition-all relative ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/20 shadow-lg shadow-blue-500/5 ring-2 ring-blue-500/20'
                          : 'border-slate-200/80 bg-white hover:border-blue-200 shadow-xs'
                      }`}
                    >
                      {plan.durationUnit === 'YEAR' && (
                        <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                          Best Value
                        </span>
                      )}

                      <div className="space-y-4">
                        <div>
                          <h4 className="font-black text-base text-slate-900">{plan.name}</h4>
                          <p className="text-xs text-slate-500 mt-1 min-h-[32px] leading-relaxed">{plan.description}</p>
                        </div>

                        <div className="pt-3 border-t border-slate-100">
                          <div className="text-3xl font-black text-slate-900">₹{plan.price}</div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                            Billed per {plan.durationValue} {plan.durationUnit?.toLowerCase()}(s)
                          </span>
                        </div>

                        {/* Bonus Rewards List */}
                        <div className="space-y-2 pt-2 text-xs text-slate-600">
                          {bonusCoins > 0 && (
                            <div className="flex items-center gap-2 text-amber-700 font-bold">
                              <Coins className="w-4 h-4 text-amber-500 shrink-0" />
                              <span>+{bonusCoins} Fair Coins Welcome Bonus</span>
                            </div>
                          )}
                          {bonusSuperCoins > 0 && (
                            <div className="flex items-center gap-2 text-blue-700 font-bold">
                              <Zap className="w-4 h-4 text-blue-600 shrink-0" />
                              <span>+{bonusSuperCoins} Super Coins</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-slate-600">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>1.5x Multiplier on Bill Uploads</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Exclusive VIP Spin Wheels</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={subscribing || isPremium}
                        onClick={() => handleSubscribe(plan._id)}
                        className={`w-full py-3 rounded-xl font-bold text-xs mt-6 transition-all shadow-md ${
                          isPremium
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                        }`}
                      >
                        {isPremium ? 'Active VIP Membership' : `Subscribe for ₹${plan.price}`}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Subscription History Table */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Subscription Transaction History</span>
            </h3>

            {history.length === 0 ? (
              <p className="text-xs text-slate-400">No previous subscription payments recorded.</p>
            ) : (
              <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Plan Name</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map((h) => (
                      <tr key={h._id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-bold text-slate-900">{h.planSnapshot?.name || 'VIP Membership'}</td>
                        <td className="py-3 px-4 font-semibold">₹{h.amount}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {h.status || 'COMPLETED'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{new Date(h.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mock Dev Test Payment Modal */}
      {showMockModal && mockPaymentData && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-3xl w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="font-black text-lg text-slate-900">Simulate VIP Payment</h3>
            <p className="text-xs text-slate-500">Test mode payment confirmation</p>
            <div className="p-4 bg-blue-50 rounded-2xl text-xs space-y-1">
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-bold">₹{mockPaymentData.amount / 100}</span>
              </div>
              <div className="flex justify-between">
                <span>Order Ref:</span>
                <span className="font-mono text-[10px]">{mockPaymentData.razorpayOrderId}</span>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowMockModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerifyPayment({
                  razorpayOrderId: mockPaymentData.razorpayOrderId,
                  razorpayPaymentId: 'mock_pay_' + Date.now(),
                  razorpaySignature: 'mock_sig_' + Date.now(),
                })}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                Simulate Success
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSubscription;
