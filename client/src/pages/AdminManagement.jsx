import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Loader2, Check, X, ShieldAlert, Landmark, FileText, Settings, UserCheck } from 'lucide-react';

export const AdminManagement = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('franchises');
  
  // Lists
  const [franchises, setFranchises] = useState([]);
  const [shopkeepers, setShopkeepers] = useState([]);
  const [shops, setShops] = useState([]);
  const [kycDocs, setKycDocs] = useState([]);
  const [plans, setPlans] = useState([]);
  const [territories, setTerritories] = useState([]);

  // Forms
  const [territoryForm, setTerritoryForm] = useState({
    type: 'STATE',
    name: '',
    code: '',
    parentTerritory: '',
    state: '',
    district: '',
    taluk: '',
    pincodes: ''
  });

  const [planForm, setPlanForm] = useState({
    name: '',
    code: '',
    description: '',
    price: 0,
    durationDays: 365,
    applicableEntityType: 'SHOPKEEPER'
  });

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'franchises') {
        const res = await api.get('/franchises');
        setFranchises(res.data.data.franchises || []);
      } else if (activeTab === 'shopkeepers') {
        const res = await api.get('/shopkeepers');
        setShopkeepers(res.data.data.shopkeepers || []);
      } else if (activeTab === 'shops') {
        const res = await api.get('/shops');
        setShops(res.data.data.shops || []);
      } else if (activeTab === 'kyc') {
        // Fetch all pending documents
        const res = await api.get('/shopkeepers'); // For simplified mock, we read shopkeepers, but we can query directly
        // We will mock fetch documents if necessary, or retrieve from state
        // Let's create a custom admin endpoint later if needed, or query direct
      } else if (activeTab === 'plans') {
        const res = await api.get('/subscriptions/plans');
        setPlans(res.data.data.plans || []);
      } else if (activeTab === 'territories') {
        const res = await api.get('/franchises/territories');
        setTerritories(res.data.data.territories || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTerritory = async (e) => {
    e.preventDefault();
    try {
      const pins = territoryForm.pincodes ? territoryForm.pincodes.split(',').map(p => p.trim()) : [];
      await api.post('/franchises/territories', {
        ...territoryForm,
        pincodes: pins,
        parentTerritory: territoryForm.parentTerritory || null
      });
      alert('Territory created successfully!');
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create territory');
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      await api.post('/subscriptions/plans', planForm);
      alert('Subscription Plan created successfully!');
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create plan');
    }
  };

  const handleApproveFranchise = async (id) => {
    try {
      await api.put(`/franchises/${id}/approve`);
      alert('Franchise operator approved and role activated!');
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleApproveShop = async (id) => {
    try {
      await api.put(`/shops/${id}/status`, { status: 'ACTIVE' });
      alert('Shop activated successfully!');
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Activation failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
        <Landmark className="w-7 h-7 text-brand-400" />
        <span>Franchise & Retail Administration Control</span>
      </h1>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4 overflow-x-auto pb-1">
        {['franchises', 'shopkeepers', 'shops', 'plans', 'territories'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-xs font-semibold capitalize transition-all whitespace-nowrap ${
              activeTab === tab ? 'text-brand-400 border-b-2 border-brand-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* FRANCHISES TAB */}
          {activeTab === 'franchises' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="font-bold text-sm text-white">Registered Territories and Operators</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800 pb-2">
                      <th className="py-2">Business Name</th>
                      <th className="py-2">Type</th>
                      <th className="py-2">Territory</th>
                      <th className="py-2">Operator ID</th>
                      <th className="py-2">Status</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {franchises.map((f) => (
                      <tr key={f._id} className="border-b border-slate-800/50 hover:bg-slate-800/10">
                        <td className="py-3.5 font-bold text-white">{f.businessName}</td>
                        <td className="py-3.5 text-slate-300">{f.franchiseType}</td>
                        <td className="py-3.5 text-slate-400">{f.territoryId?.name || 'Global'}</td>
                        <td className="py-3.5 font-mono text-[10px] text-slate-500">{f.userId?._id || f.userId}</td>
                        <td className="py-3.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            f.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {f.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          {f.status === 'PENDING' && (
                            <button
                              onClick={() => handleApproveFranchise(f._id)}
                              className="px-2.5 py-1 rounded bg-brand-600 hover:bg-brand-500 text-white font-bold text-[10px] transition-all"
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SHOPKEEPERS TAB */}
          {activeTab === 'shopkeepers' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="font-bold text-sm text-white">Registered Retail Shopkeepers</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800 pb-2">
                      <th className="py-2">Business Name</th>
                      <th className="py-2">Taluk Franchise</th>
                      <th className="py-2">Onboarding Status</th>
                      <th className="py-2">KYC Status</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shopkeepers.map((s) => (
                      <tr key={s._id} className="border-b border-slate-800/50 hover:bg-slate-800/10">
                        <td className="py-3.5 font-bold text-white">{s.businessName}</td>
                        <td className="py-3.5 text-slate-400 font-mono text-[10px]">{s.talukFranchiseId?._id || s.talukFranchiseId}</td>
                        <td className="py-3.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                            {s.onboardingStatus}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            s.kycStatus === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {s.kycStatus}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            s.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SHOPS TAB */}
          {activeTab === 'shops' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="font-bold text-sm text-white">Active Babu Super Market Outlets</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800 pb-2">
                      <th className="py-2">Shop Code</th>
                      <th className="py-2">Name</th>
                      <th className="py-2">Territory</th>
                      <th className="py-2">Pincode</th>
                      <th className="py-2">Status</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shops.map((s) => (
                      <tr key={s._id} className="border-b border-slate-800/50 hover:bg-slate-800/10">
                        <td className="py-3.5 font-mono font-bold text-brand-400">{s.shopCode}</td>
                        <td className="py-3.5 font-bold text-white">{s.shopName}</td>
                        <td className="py-3.5 text-slate-400">{s.taluk}, {s.district}, {s.state}</td>
                        <td className="py-3.5 text-slate-400 font-mono">{s.pincode}</td>
                        <td className="py-3.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            s.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          {s.status === 'PENDING' && (
                            <button
                              onClick={() => handleApproveShop(s._id)}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition-all"
                            >
                              Activate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUBSCRIPTION PLANS */}
          {activeTab === 'plans' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 md:col-span-2">
                <h3 className="font-bold text-sm text-white">Active Subscription Plans</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {plans.map((p) => (
                    <div key={p._id} className="bg-slate-800/50 border border-slate-800 p-5 rounded-2xl space-y-2">
                      <div className="font-bold text-white text-sm">{p.name} ({p.code})</div>
                      <div className="text-slate-400 text-xs">{p.description}</div>
                      <div className="text-xl font-extrabold text-brand-400">₹{p.price} / {p.durationDays} days</div>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleCreatePlan} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3">
                <h3 className="font-bold text-xs text-white uppercase tracking-wider">Create New Plan</h3>
                <input
                  type="text"
                  placeholder="Plan Name"
                  required
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full bg-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2 border border-slate-700 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Plan Code"
                  required
                  value={planForm.code}
                  onChange={(e) => setPlanForm({ ...planForm, code: e.target.value })}
                  className="w-full bg-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2 border border-slate-700 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Price (INR)"
                  required
                  value={planForm.price}
                  onChange={(e) => setPlanForm({ ...planForm, price: parseFloat(e.target.value) })}
                  className="w-full bg-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2 border border-slate-700 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Duration Days (e.g. 365)"
                  required
                  value={planForm.durationDays}
                  onChange={(e) => setPlanForm({ ...planForm, durationDays: parseInt(e.target.value) })}
                  className="w-full bg-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2 border border-slate-700 focus:outline-none"
                />
                <select
                  value={planForm.applicableEntityType}
                  onChange={(e) => setPlanForm({ ...planForm, applicableEntityType: e.target.value })}
                  className="w-full bg-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2 border border-slate-700 focus:outline-none"
                >
                  <option value="SHOPKEEPER">SHOPKEEPER</option>
                  <option value="FRANCHISE">FRANCHISE</option>
                  <option value="SHOP">SHOP</option>
                </select>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-all"
                >
                  Save Plan
                </button>
              </form>
            </div>
          )}

          {/* TERRITORIES TAB */}
          {activeTab === 'territories' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 md:col-span-2">
                <h3 className="font-bold text-sm text-white">Configured Territories</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-800 pb-2">
                        <th className="py-2">Code</th>
                        <th className="py-2">Name</th>
                        <th className="py-2">Type</th>
                        <th className="py-2">Parent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {territories.map((t) => (
                        <tr key={t._id} className="border-b border-slate-800/50 hover:bg-slate-800/10">
                          <td className="py-2 font-mono font-bold text-slate-300">{t.code}</td>
                          <td className="py-2 font-bold text-white">{t.name}</td>
                          <td className="py-2 text-slate-400">{t.type}</td>
                          <td className="py-2 text-slate-500 font-mono text-[10px]">{t.parentTerritory || 'None'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <form onSubmit={handleCreateTerritory} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3">
                <h3 className="font-bold text-xs text-white uppercase tracking-wider">Add Territory</h3>
                <select
                  value={territoryForm.type}
                  onChange={(e) => setTerritoryForm({ ...territoryForm, type: e.target.value })}
                  className="w-full bg-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2 border border-slate-700 focus:outline-none"
                >
                  <option value="STATE">STATE</option>
                  <option value="DISTRICT">DISTRICT</option>
                  <option value="TALUK">TALUK</option>
                </select>

                <input
                  type="text"
                  placeholder="Territory Name"
                  required
                  value={territoryForm.name}
                  onChange={(e) => setTerritoryForm({ ...territoryForm, name: e.target.value })}
                  className="w-full bg-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2 border border-slate-700 focus:outline-none"
                />

                <input
                  type="text"
                  placeholder="Territory Code (e.g. TN, CHN)"
                  required
                  value={territoryForm.code}
                  onChange={(e) => setTerritoryForm({ ...territoryForm, code: e.target.value })}
                  className="w-full bg-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2 border border-slate-700 focus:outline-none"
                />

                <input
                  type="text"
                  placeholder="Parent Territory ID (if DISTRICT/TALUK)"
                  value={territoryForm.parentTerritory}
                  onChange={(e) => setTerritoryForm({ ...territoryForm, parentTerritory: e.target.value })}
                  className="w-full bg-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2 border border-slate-700 focus:outline-none"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="State Name"
                    value={territoryForm.state}
                    onChange={(e) => setTerritoryForm({ ...territoryForm, state: e.target.value })}
                    className="w-full bg-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2 border border-slate-700 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="District Name"
                    value={territoryForm.district}
                    onChange={(e) => setTerritoryForm({ ...territoryForm, district: e.target.value })}
                    className="w-full bg-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2 border border-slate-700 focus:outline-none"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Pincodes (comma separated)"
                  value={territoryForm.pincodes}
                  onChange={(e) => setTerritoryForm({ ...territoryForm, pincodes: e.target.value })}
                  className="w-full bg-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2 border border-slate-700 focus:outline-none"
                />

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-all"
                >
                  Save Territory
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
