import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Coins,
  Store,
  User,
  Sparkles,
  RefreshCw,
  AlertCircle,
  X,
  Layers
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export const SuperAdminSubscriptions = () => {
  const [loading, setLoading] = useState(true);
  const [vendorPlans, setVendorPlans] = useState([]);
  const [customerPlans, setCustomerPlans] = useState([]);
  const [activeTab, setActiveTab] = useState('VENDOR'); // 'VENDOR' or 'CUSTOMER'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    monthlyPrice: '',
    yearlyPrice: '',
    price: '',
    durationValue: 1,
    durationUnit: 'MONTH',
    features: '',
    coinsReward: 100,
  });

  const loadPlans = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await superAdminService.getSubscriptionPlans();
      if (res) {
        setVendorPlans(res.vendorPlans || []);
        setCustomerPlans(res.customerPlans || []);
      }
    } catch (err) {
      console.error('Failed to load subscription plans:', err);
      setErrorMsg('Failed to fetch subscription plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      monthlyPrice: '',
      yearlyPrice: '',
      price: '',
      durationValue: 1,
      durationUnit: 'MONTH',
      features: '',
      coinsReward: 100,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    if (activeTab === 'VENDOR') {
      setFormData({
        name: plan.name,
        code: plan.code,
        description: plan.description || '',
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        price: '',
        durationValue: 1,
        durationUnit: 'MONTH',
        features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
        coinsReward: 0,
      });
    } else {
      setFormData({
        name: plan.name,
        code: plan.code,
        description: plan.description || '',
        monthlyPrice: '',
        yearlyPrice: '',
        price: plan.price,
        durationValue: plan.durationValue || 1,
        durationUnit: plan.durationUnit || 'MONTH',
        features: '',
        coinsReward: plan.rewardRules?.coinsOnSubscribe || 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setErrorMsg('');
      const payload = {
        planType: activeTab,
        name: formData.name,
        code: formData.code,
        description: formData.description,
        ...(activeTab === 'VENDOR'
          ? {
              monthlyPrice: Number(formData.monthlyPrice),
              yearlyPrice: Number(formData.yearlyPrice),
              features: formData.features.split('\n').filter(Boolean),
            }
          : {
              price: Number(formData.price),
              durationValue: Number(formData.durationValue),
              durationUnit: formData.durationUnit,
              coinsReward: Number(formData.coinsReward),
            }),
      };

      if (editingPlan) {
        await superAdminService.updateSubscriptionPlan(editingPlan._id, payload);
        setSuccessMsg(`Plan '${formData.name}' updated successfully.`);
      } else {
        await superAdminService.createSubscriptionPlan(payload);
        setSuccessMsg(`Plan '${formData.name}' created successfully.`);
      }

      setIsModalOpen(false);
      loadPlans();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Plan save error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to save plan');
    }
  };

  const handleToggleStatus = async (plan) => {
    try {
      await superAdminService.deleteSubscriptionPlan(plan._id, activeTab);
      loadPlans();
      setSuccessMsg(`Plan status updated`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to toggle status:', err);
      setErrorMsg('Failed to update plan status');
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Top Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm"
      >
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-600 uppercase tracking-wider mb-1">
            <CreditCard className="w-4 h-4" /> Monetization Architecture
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Subscription Plans</h1>
          <p className="text-xs text-slate-500">
            Control customer membership tiers (with Fair Coin rewards) and merchant vendor subscription plans.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadPlans}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New {activeTab === 'VENDOR' ? 'Vendor' : 'Customer'} Plan</span>
          </button>
        </div>
      </motion.div>

      {successMsg && (
        <motion.div
          variants={itemVariants}
          className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-2xl flex items-center gap-2 shadow-sm"
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span className="font-semibold">{successMsg}</span>
        </motion.div>
      )}

      {errorMsg && (
        <motion.div
          variants={itemVariants}
          className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2 shadow-sm"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span className="font-semibold">{errorMsg}</span>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('VENDOR')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
            activeTab === 'VENDOR'
              ? 'bg-blue-600 text-white shadow-blue-500/20'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Vendor Subscription Plans ({vendorPlans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CUSTOMER')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
            activeTab === 'CUSTOMER'
              ? 'bg-blue-600 text-white shadow-blue-500/20'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Customer Premium Plans ({customerPlans.length})</span>
        </button>
      </div>

      {/* Plans Grid with Hover Animations */}
      {activeTab === 'VENDOR' ? (
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {vendorPlans.map((plan) => (
            <motion.div
              key={plan._id}
              variants={itemVariants}
              whileHover={{ y: -3, transition: { duration: 0.18 } }}
              className={`p-6 rounded-3xl border transition relative flex flex-col justify-between ${
                plan.isActive
                  ? 'bg-white border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                    {plan.code}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      plan.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {plan.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <h3 className="text-lg font-black text-slate-900 mb-1">{plan.name}</h3>
                <p className="text-xs text-slate-500 mb-4 min-h-[32px]">{plan.description || 'Merchant listing tier'}</p>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 mb-4 flex justify-between items-baseline">
                  <div>
                    <span className="text-2xl font-black text-blue-600 font-mono">
                      ₹{plan.monthlyPrice?.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold"> / mo</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block">YEARLY</span>
                    <span className="text-xs font-bold text-slate-700 font-mono">
                      ₹{plan.yearlyPrice?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2 mb-6">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Features Included</p>
                  {plan.features && plan.features.length > 0 ? (
                    plan.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        <span className="truncate font-medium">{f}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No features specified</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => openEditModal(plan)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleToggleStatus(plan)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                    plan.isActive
                      ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {plan.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        /* Customer Premium Plans */
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {customerPlans.map((plan) => (
            <motion.div
              key={plan._id}
              variants={itemVariants}
              whileHover={{ y: -3, transition: { duration: 0.18 } }}
              className={`p-6 rounded-3xl border transition relative flex flex-col justify-between ${
                plan.status === 'ACTIVE'
                  ? 'bg-white border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                    {plan.code}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      plan.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {plan.status}
                  </span>
                </div>

                <h3 className="text-lg font-black text-slate-900 mb-1">{plan.name}</h3>
                <p className="text-xs text-slate-500 mb-4 min-h-[32px]">{plan.description || 'Customer membership tier'}</p>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 mb-4 flex justify-between items-baseline">
                  <div>
                    <span className="text-2xl font-black text-blue-600 font-mono">
                      ₹{plan.price?.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      {' '}
                      / {plan.durationValue} {plan.durationUnit?.toLowerCase()}
                    </span>
                  </div>
                </div>

                {/* Coin Reward Badge */}
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-amber-800">Welcome Coins:</span>
                  </div>
                  <span className="font-mono font-black text-amber-700 text-sm">
                    +{plan.rewardRules?.coinsOnSubscribe || 0}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => openEditModal(plan)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleToggleStatus(plan)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                    plan.status === 'ACTIVE'
                      ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {plan.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Animated Create / Edit Plan Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-black text-slate-900 mb-1">
                {editingPlan ? 'Edit' : 'Create'} {activeTab === 'VENDOR' ? 'Vendor' : 'Customer'} Plan
              </h2>
              <p className="text-xs text-slate-500 mb-5">
                Fill in the parameters for this monetization subscription tier.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Plan Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Gold Merchant"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Plan Code *</label>
                    <input
                      type="text"
                      required
                      disabled={Boolean(editingPlan)}
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. VENDOR_GOLD"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:bg-white transition disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                  <textarea
                    rows="2"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Short description of benefits"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                  />
                </div>

                {activeTab === 'VENDOR' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Monthly Price (₹) *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={formData.monthlyPrice}
                          onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })}
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:bg-white transition"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Yearly Price (₹) *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={formData.yearlyPrice}
                          onChange={(e) => setFormData({ ...formData, yearlyPrice: e.target.value })}
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Features List (one per line)
                      </label>
                      <textarea
                        rows="3"
                        value={formData.features}
                        onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                        placeholder="Unlimited product listings&#10;Priority search ranking&#10;Dedicated account manager"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:bg-white transition"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Price (₹) *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:bg-white transition"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Duration *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={formData.durationValue}
                          onChange={(e) => setFormData({ ...formData, durationValue: e.target.value })}
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:bg-white transition"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Unit *</label>
                        <select
                          value={formData.durationUnit}
                          onChange={(e) => setFormData({ ...formData, durationUnit: e.target.value })}
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                        >
                          <option value="DAY">Day(s)</option>
                          <option value="MONTH">Month(s)</option>
                          <option value="YEAR">Year(s)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Fair Coins Credited on Subscribe
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.coinsReward}
                        onChange={(e) => setFormData({ ...formData, coinsReward: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:bg-white transition"
                      />
                    </div>
                  </>
                )}

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition"
                  >
                    {editingPlan ? 'Save Changes' : 'Create Plan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SuperAdminSubscriptions;
