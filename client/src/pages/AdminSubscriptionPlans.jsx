import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Loader2, Plus, Edit2, CheckCircle, XCircle } from 'lucide-react';

export const AdminSubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    monthlyPrice: '',
    yearlyPrice: '',
    currency: 'INR',
    applicableEntityType: 'VENDOR',
    features: '',
    displayOrder: 0
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/subscription-plans?entityType=VENDOR');
      setPlans(res.data.data.plans);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        features: typeof formData.features === 'string' ? formData.features.split(',').map(f => f.trim()) : formData.features
      };
      
      if (formData._id) {
        await api.put(`/admin/subscription-plans/${formData._id}`, payload);
      } else {
        await api.post('/admin/subscription-plans', payload);
      }
      setShowModal(false);
      setFormData({ name: '', code: '', description: '', monthlyPrice: '', yearlyPrice: '', currency: 'INR', applicableEntityType: 'VENDOR', features: '', displayOrder: 0 });
      fetchPlans();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving plan');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/admin/subscription-plans/${id}/status`, { isActive: !currentStatus });
      fetchPlans();
    } catch (err) {
      alert('Error updating status');
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vendor Subscription Plans</h1>
        <button 
          onClick={() => {
            setFormData({ name: '', code: '', description: '', monthlyPrice: '', yearlyPrice: '', currency: 'INR', applicableEntityType: 'VENDOR', features: '', displayOrder: 0 });
            setShowModal(true);
          }}
          className="bg-brand-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold"
        >
          <Plus className="w-4 h-4" /> Create Plan
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Plan Name</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Monthly</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Yearly</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {plans.map(plan => (
              <tr key={plan._id} className="hover:bg-slate-50">
                <td className="p-4">
                  <div className="font-bold text-slate-800">{plan.name}</div>
                  <div className="text-xs text-slate-500">{plan.code}</div>
                </td>
                <td className="p-4 text-sm">₹{plan.monthlyPrice}</td>
                <td className="p-4 text-sm">₹{plan.yearlyPrice}</td>
                <td className="p-4">
                  {plan.isActive ? (
                    <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold">ACTIVE</span>
                  ) : (
                    <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded text-xs font-bold">INACTIVE</span>
                  )}
                </td>
                <td className="p-4 flex gap-2">
                  <button 
                    onClick={() => {
                      setFormData({ ...plan, features: plan.features.join(', ') });
                      setShowModal(true);
                    }}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => toggleStatus(plan._id, plan.isActive)}
                    className={`p-1 rounded ${plan.isActive ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                  >
                    {plan.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
            {plans.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500">No subscription plans found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold mb-4">{formData._id ? 'Edit Plan' : 'Create Plan'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Plan Name *</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Code *</label>
                  <input required disabled={!!formData._id} value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full border rounded p-2 text-sm uppercase" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Monthly Price (₹) *</label>
                  <input required type="number" min="0" value={formData.monthlyPrice} onChange={e => setFormData({...formData, monthlyPrice: e.target.value})} className="w-full border rounded p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Yearly Price (₹) *</label>
                  <input required type="number" min="0" value={formData.yearlyPrice} onChange={e => setFormData({...formData, yearlyPrice: e.target.value})} className="w-full border rounded p-2 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border rounded p-2 text-sm"></textarea>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Features (comma separated)</label>
                  <textarea value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} className="w-full border rounded p-2 text-sm" placeholder="Feature 1, Feature 2"></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Display Order</label>
                  <input type="number" value={formData.displayOrder} onChange={e => setFormData({...formData, displayOrder: e.target.value})} className="w-full border rounded p-2 text-sm" />
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 rounded text-sm font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded text-sm font-bold">Save Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
