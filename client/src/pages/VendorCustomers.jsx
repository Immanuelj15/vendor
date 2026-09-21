import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users } from 'lucide-react';

export default function VendorCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);

  useEffect(() => {
    fetchCustomers();
  }, [page]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/vendors/customers?page=${page}&limit=15`);
      setCustomers(res.data.data.customers);
      setTotalPages(res.data.data.pages);
      setTotalCustomers(res.data.data.total);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  if (loading && customers.length === 0) {
    return <div className="p-8 text-center text-gray-500">Loading customers...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Users className="w-6 h-6 mr-2 text-blue-600" />
            My Customers
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Total attributed customers: {totalCustomers}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Attribution Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Attributed Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{customer.name || 'Anonymous User'}</div>
                  <div className="text-xs text-gray-400">ID: {customer.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    customer.isPrimary ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {customer.isPrimary ? 'Primary' : 'Secondary'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {customer.source === 'QR_SCAN' ? 'QR Code' : customer.source}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(customer.attributedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                  No customers attributed to your shop yet. Share your QR code!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 border rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-600">Page {page} of {totalPages}</span>
          <button 
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 border rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
