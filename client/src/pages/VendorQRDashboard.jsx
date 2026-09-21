import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { QrCode, Download, Share2, Users, Eye, RefreshCw } from 'lucide-react';

export default function VendorQRDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchQRStats();
  }, []);

  const fetchQRStats = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/vendors/qr/stats');
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch QR details. Ensure you are approved and active.');
    } finally {
      setLoading(false);
    }
  };

  const qrUrl = data?.qr ? `${window.location.origin}/v/${data.qr.publicToken}` : '';
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}`;

  const handleDownload = async () => {
    if (!qrImageUrl) return;
    try {
      setDownloading(true);
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vendor_qr_code.png';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      alert('Failed to download QR code');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading QR Dashboard...</div>;
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

  if (!data?.qr) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md">
          QR Code not generated or not available.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My QR Code</h1>
        <button 
          onClick={fetchQRStats}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: QR Code Display */}
        <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <div className="w-48 h-48 bg-gray-50 rounded-lg p-2 mb-4 border flex items-center justify-center relative">
             <img src={qrImageUrl} alt="Vendor QR" className="w-full h-full object-contain" />
          </div>
          
          <p className="text-sm text-gray-500 mb-4 font-mono">{data.qr.publicToken}</p>
          
          <div className="flex space-x-3 w-full">
            <button 
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              <Download className="w-4 h-4 mr-2" />
              {downloading ? 'Downloading...' : 'Download'}
            </button>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(qrUrl);
                alert('Copied link to clipboard!');
              }}
              className="flex-1 flex items-center justify-center bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Copy Link
            </button>
          </div>
        </div>

        {/* Right Column: Stats */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 text-sm font-medium">Total Scans</h3>
                <Eye className="text-blue-500 w-5 h-5" />
              </div>
              <p className="text-3xl font-bold text-gray-800">{data.stats.totalScans}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 text-sm font-medium">Unique Visitors</h3>
                <Users className="text-purple-500 w-5 h-5" />
              </div>
              <p className="text-3xl font-bold text-gray-800">{data.stats.uniqueVisitors}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 text-sm font-medium">Attributed Customers</h3>
                <QrCode className="text-green-500 w-5 h-5" />
              </div>
              <p className="text-3xl font-bold text-gray-800">{data.stats.attributedCustomers}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">How it works</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 flex-shrink-0 text-xs">1</span>
                Print this QR code and place it in your shop or share the link digitally.
              </li>
              <li className="flex items-start">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 flex-shrink-0 text-xs">2</span>
                Customers scan the code using their phone's camera.
              </li>
              <li className="flex items-start">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 flex-shrink-0 text-xs">3</span>
                If it's their first time scanning a vendor on the platform, they become permanently attributed to you.
              </li>
              <li className="flex items-start">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 flex-shrink-0 text-xs">4</span>
                You will receive commission benefits on their future purchases (based on active subscription and eligibility).
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
