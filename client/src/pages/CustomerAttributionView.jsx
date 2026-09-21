import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Store, Calendar, ShieldCheck, MapPin } from 'lucide-react';

export default function CustomerAttributionView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAttribution();
  }, []);

  const fetchAttribution = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/me/attribution');
      setData(res.data.data);
    } catch (err) {
      setError('Failed to fetch attribution history.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading your network...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Shopkeeper</h1>

      {/* Primary Attribution Card */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden mb-8">
        <div className="bg-blue-600 px-6 py-4">
          <h2 className="text-lg font-semibold text-white flex items-center">
            <ShieldCheck className="w-5 h-5 mr-2" />
            Primary Associated Shop
          </h2>
        </div>
        
        {data.primaryVendor ? (
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-6">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mb-4 md:mb-0">
                <Store className="w-10 h-10 text-gray-400" />
              </div>
              <div className="text-center md:text-left flex-1">
                <h3 className="text-xl font-bold text-gray-900">{data.primaryVendor.storeName}</h3>
                
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-gray-600 flex items-center justify-center md:justify-start">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    {data.primaryVendor.city}, {data.primaryVendor.state}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center justify-center md:justify-start">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    Associated Since: {new Date(data.primarySince).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Primary Shop</h3>
            <p className="text-gray-500 text-sm">
              You haven't connected with a shop yet. Scan a shopkeeper's QR code to associate your account.
            </p>
          </div>
        )}
      </div>

      {/* Attribution History */}
      {data.history && data.history.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">Attribution History</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {data.history.map((h, i) => (
              <div key={i} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition">
                <div>
                  <h4 className="text-md font-semibold text-gray-900 flex items-center">
                    {h.vendorName}
                    {h.isPrimary && (
                      <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Primary
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1 flex items-center">
                    <MapPin className="w-3 h-3 mr-1" /> {h.location}
                  </p>
                </div>
                <div className="mt-3 sm:mt-0 text-sm text-gray-500 flex flex-col sm:items-end">
                  <span>{new Date(h.date).toLocaleDateString()}</span>
                  <span className="text-xs mt-1 text-gray-400">{h.source === 'QR_SCAN' ? 'via QR Scan' : h.source}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
