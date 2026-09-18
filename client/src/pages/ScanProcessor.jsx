import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Store, ShieldCheck, MapPin } from 'lucide-react';

export default function ScanProcessor() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vendor, setVendor] = useState(null);
  const [attribution, setAttribution] = useState(null);

  useEffect(() => {
    processScan();
  }, [token]);

  const processScan = async () => {
    try {
      setLoading(true);
      // In a real app, Axios interceptor will automatically attach the JWT token if logged in.
      // If the user is not logged in, it sends the request anonymously.
      const res = await axios.get(`/api/qr/${token}`);
      
      setVendor(res.data.data.vendor);
      
      if (res.data.data.requireLogin) {
        // Option A: Save token to sessionStorage and redirect to Login
        sessionStorage.setItem('pending_qr_token', token);
        // Let them see the profile first, we don't immediately redirect.
        // We'll show a "Login to Connect" button.
      } else {
        // User was logged in and attribution was processed
        setAttribution(res.data.data.attribution);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired QR code.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    sessionStorage.setItem('pending_qr_token', token);
    navigate('/login?redirect=/v/' + token);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing scan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold">!</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Scan Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-12 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* Banner */}
        <div className="h-32 bg-blue-600 w-full object-cover"></div>
        
        <div className="px-6 sm:px-8 pb-8">
          {/* Logo */}
          <div className="-mt-12 flex justify-center mb-4">
            <div className="w-24 h-24 bg-white rounded-full p-2 shadow-md">
              <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                {vendor.logo ? (
                  <img src={vendor.logo} alt={vendor.storeName} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-10 h-10 text-gray-400" />
                )}
              </div>
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">{vendor.storeName}</h1>
            {vendor.description && (
              <p className="text-gray-500 mt-2 text-sm">{vendor.description}</p>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100">
            {attribution ? (
              <div className="text-center">
                <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900 mb-1">Connected Successfully</h3>
                <p className="text-gray-600 text-sm">
                  You are now connected with {vendor.storeName}. 
                  {attribution.isPrimary ? ' They are your primary preferred shop.' : ' They have been added to your shop network.'}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Connect with this Shop</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Log in to automatically connect with {vendor.storeName} and unlock special offers and benefits.
                </p>
                <button 
                  onClick={handleConnect}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Log In or Register to Connect
                </button>
              </div>
            )}
          </div>

          <div className="text-center">
            <button onClick={() => navigate('/')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Browse Platform
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
