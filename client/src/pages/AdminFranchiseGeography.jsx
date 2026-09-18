import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Loader2, MapPin, Plus, Edit2, Trash2 } from 'lucide-react';

export const AdminFranchiseGeography = () => {
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [taluks, setTaluks] = useState([]);

  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  // Form States
  const [formData, setFormData] = useState({
    type: 'STATE',
    name: '',
    code: '',
    parentTerritory: '',
    pincodes: ''
  });

  useEffect(() => {
    fetchStates();
  }, []);

  useEffect(() => {
    if (selectedState) fetchDistricts(selectedState);
    else setDistricts([]);
  }, [selectedState]);

  useEffect(() => {
    if (selectedDistrict) fetchTaluks(selectedDistrict);
    else setTaluks([]);
  }, [selectedDistrict]);

  const fetchStates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/franchises/territories?type=STATE');
      setStates(res.data.data.territories);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistricts = async (stateId) => {
    try {
      const res = await api.get(`/franchises/territories?type=DISTRICT&parentTerritory=${stateId}`);
      setDistricts(res.data.data.territories);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTaluks = async (districtId) => {
    try {
      const res = await api.get(`/franchises/territories?type=TALUK&parentTerritory=${districtId}`);
      setTaluks(res.data.data.territories);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        pincodes: formData.pincodes.split(',').map(p => p.trim()).filter(Boolean)
      };
      await api.post('/admin/territories', payload);
      alert('Territory added successfully');
      setFormData({ type: 'STATE', name: '', code: '', parentTerritory: '', pincodes: '' });
      if (formData.type === 'STATE') fetchStates();
      if (formData.type === 'DISTRICT' && selectedState) fetchDistricts(selectedState);
      if (formData.type === 'TALUK' && selectedDistrict) fetchTaluks(selectedDistrict);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to add territory');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
        <MapPin className="w-7 h-7 text-brand-400" />
        <span>Geography & Franchise Manager</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Add Territory Form */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-brand-400" />
            <span>Add New Territory</span>
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400">Territory Type</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value, parentTerritory: ''})}
                className="w-full bg-slate-800 text-slate-100 px-3 py-2.5 rounded-xl border border-slate-700 text-xs focus:outline-none mt-1"
              >
                <option value="STATE">State</option>
                <option value="DISTRICT">District</option>
                <option value="TALUK">Taluk / Area</option>
              </select>
            </div>

            {formData.type === 'DISTRICT' && (
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Parent State</label>
                <select 
                  required
                  value={formData.parentTerritory}
                  onChange={(e) => setFormData({...formData, parentTerritory: e.target.value})}
                  className="w-full bg-slate-800 text-slate-100 px-3 py-2.5 rounded-xl border border-slate-700 text-xs focus:outline-none mt-1"
                >
                  <option value="">Select State...</option>
                  {states.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            )}

            {formData.type === 'TALUK' && (
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Parent District</label>
                <select 
                  required
                  value={formData.parentTerritory}
                  onChange={(e) => setFormData({...formData, parentTerritory: e.target.value})}
                  className="w-full bg-slate-800 text-slate-100 px-3 py-2.5 rounded-xl border border-slate-700 text-xs focus:outline-none mt-1"
                >
                  <option value="">Select District...</option>
                  {districts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400">Name</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Karnataka"
                className="w-full bg-slate-800 text-slate-100 px-3 py-2.5 rounded-xl border border-slate-700 text-xs focus:outline-none mt-1"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400">Code</label>
              <input 
                required
                type="text" 
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                placeholder="e.g. KA"
                className="w-full bg-slate-800 text-slate-100 px-3 py-2.5 rounded-xl border border-slate-700 text-xs focus:outline-none mt-1 uppercase"
              />
            </div>

            {formData.type === 'TALUK' && (
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Pincodes (Comma separated)</label>
                <textarea 
                  value={formData.pincodes}
                  onChange={(e) => setFormData({...formData, pincodes: e.target.value})}
                  placeholder="e.g. 560001, 560002"
                  className="w-full bg-slate-800 text-slate-100 px-3 py-2.5 rounded-xl border border-slate-700 text-xs focus:outline-none mt-1 h-20"
                />
              </div>
            )}

            <button type="submit" className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all">
              Save Territory
            </button>
          </form>
        </div>

        {/* Territory Viewer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-sm text-white">Territory Viewer</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">View State</label>
                <select 
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelectedDistrict('');
                  }}
                  className="w-full bg-slate-800 text-slate-100 px-3 py-2.5 rounded-xl border border-slate-700 text-xs focus:outline-none mt-1"
                >
                  <option value="">Select State...</option>
                  {states.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>

              {selectedState && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">View District</label>
                  <select 
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full bg-slate-800 text-slate-100 px-3 py-2.5 rounded-xl border border-slate-700 text-xs focus:outline-none mt-1"
                  >
                    <option value="">Select District...</option>
                    {districts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div>
            ) : (
              <div className="space-y-3 mt-6">
                {selectedDistrict ? (
                  taluks.length > 0 ? taluks.map(t => (
                    <div key={t._id} className="bg-slate-800 p-4 rounded-xl flex justify-between items-center border border-slate-700">
                      <div>
                        <div className="font-bold text-white text-sm">{t.name} <span className="text-slate-400 text-xs ml-2">({t.code})</span></div>
                        <div className="text-xs text-slate-400 mt-1">Pincodes: {t.pincodes?.join(', ') || 'None'}</div>
                      </div>
                    </div>
                  )) : <p className="text-xs text-slate-400">No taluks found in this district.</p>
                ) : selectedState ? (
                  districts.length > 0 ? districts.map(d => (
                    <div key={d._id} className="bg-slate-800 p-4 rounded-xl flex justify-between items-center border border-slate-700">
                      <div className="font-bold text-white text-sm">{d.name} <span className="text-slate-400 text-xs ml-2">({d.code})</span></div>
                    </div>
                  )) : <p className="text-xs text-slate-400">No districts found in this state.</p>
                ) : (
                  states.length > 0 ? states.map(s => (
                    <div key={s._id} className="bg-slate-800 p-4 rounded-xl flex justify-between items-center border border-slate-700">
                      <div className="font-bold text-white text-sm">{s.name} <span className="text-slate-400 text-xs ml-2">({s.code})</span></div>
                    </div>
                  )) : <p className="text-xs text-slate-400">No states found.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
