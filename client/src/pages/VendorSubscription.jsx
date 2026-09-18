import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Loader2, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export const VendorSubscription = () => {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subRes, plansRes] = await Promise.all([
        api.get('/vendor-subscriptions/current').catch(() => ({ data: { data: { subscription: null } } })),
        api.get('/vendor-subscriptions/plans')
      ]);
      setSubscription(subRes.data.data.subscription);
      setPlans(plansRes.data.data.plans || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChoosePlan = (planId, billingCycle) => {
    navigate('/vendor/subscription/checkout', { state: { planId, billingCycle } });
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  const isActive = subscription?.status === 'ACTIVE';
  const isExpiringSoon = isActive && new Date(subscription.endDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">My Subscription</h1>
      
      {/* Current Subscription Card */}
      <div className={`p-6 rounded-2xl border ${isActive ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
        {subscription ? (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{subscription.planId?.name || 'Unknown Plan'}</h2>
              <div className="flex gap-4 mt-2">
                <span className="text-sm font-semibold text-slate-600 flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> {subscription.billingCycle}
                </span>
                <span className={`text-sm font-bold flex items-center gap-1 ${isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isActive ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {subscription.status}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Started: {new Date(subscription.startDate).toLocaleDateString()} &bull; Expires: {new Date(subscription.endDate).toLocaleDateString()}
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              {isExpiringSoon && <span className="text-xs font-bold text-amber-600 flex items-center gap-1"><Clock className="w-4 h-4" /> Expiring Soon</span>}
              <button 
                onClick={() => navigate('/vendor/subscription/plans')}
                className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-xl font-bold shadow-lg"
              >
                {isActive ? 'Renew Plan' : 'Subscribe Now'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <h2 className="text-lg font-bold text-slate-700 mb-2">No Active Subscription</h2>
            <p className="text-slate-500 text-sm mb-4">You need an active subscription to start selling on the platform.</p>
          </div>
        )}
      </div>

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-bold mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan._id} className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all flex flex-col">
              <h3 className="text-lg font-bold text-slate-800">{plan.name}</h3>
              <p className="text-sm text-slate-500 mb-4 h-10">{plan.description}</p>
              
              <div className="space-y-4 flex-1">
                <div className="p-3 border rounded-xl hover:border-brand-500 cursor-pointer flex justify-between items-center" onClick={() => handleChoosePlan(plan._id, 'MONTHLY')}>
                  <div>
                    <div className="text-xs font-bold text-slate-500">MONTHLY</div>
                    <div className="text-lg font-black text-slate-800">₹{plan.monthlyPrice}</div>
                  </div>
                  <button className="bg-slate-100 hover:bg-brand-50 text-brand-600 text-xs font-bold px-3 py-1.5 rounded-lg">Select</button>
                </div>
                
                <div className="p-3 border rounded-xl border-brand-200 bg-brand-50 hover:border-brand-500 cursor-pointer flex justify-between items-center relative" onClick={() => handleChoosePlan(plan._id, 'YEARLY')}>
                  <div className="absolute -top-2.5 right-4 bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">SAVE MORE</div>
                  <div>
                    <div className="text-xs font-bold text-brand-700">YEARLY</div>
                    <div className="text-lg font-black text-slate-800">₹{plan.yearlyPrice}</div>
                  </div>
                  <button className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg">Select</button>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Features included:</div>
                <ul className="space-y-2">
                  {plan.features?.map((feature, i) => (
                    <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
};
