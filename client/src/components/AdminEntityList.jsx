import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { Loader2, Search, Check, X, RotateCcw, AlertCircle } from 'lucide-react';

export const AdminEntityList = () => {
  const location = useLocation();
  const entityType = location.pathname.split('/').pop(); // 'users', 'vendors', etc.

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Forms for Coupon/Campaign Creation
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [couponForm, setCouponForm] = useState({ code: '', discountType: 'PERCENTAGE', discountValue: 10, minPurchase: 100, maxDiscount: 50 });
  const [campaignForm, setCampaignForm] = useState({ title: '', description: '', multiplier: 2 });

  useEffect(() => {
    fetchEntities();
  }, [entityType, search, statusFilter, page]);

  const fetchEntities = async () => {
    setLoading(true);
    try {
      const endpoint = entityType === 'fulfillment' ? 'fulfillments' : entityType === 'delivery' ? 'deliveries' : entityType;
      
      const queryParams = new URLSearchParams({
        page,
        limit: 10,
        search,
        status: statusFilter
      });

      const res = await api.get(`/admin/${endpoint}?${queryParams.toString()}`);
      
      // Handle response structure differences
      const data = res.data?.data || {};
      setItems(data[endpoint] || data.items || data.users || data.vendors || data.products || data.orders || data.payments || data.commissions || data.settlements || data.fulfillments || data.deliveries || data.coupons || data.campaigns || []);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.error('Error fetching admin entities', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const endpoint = entityType === 'fulfillment' ? 'fulfillments' : entityType === 'delivery' ? 'deliveries' : entityType;
      await api.put(`/admin/${endpoint}/${id}/status`, { status: newStatus });
      alert('Status updated successfully!');
      fetchEntities();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleReverseSettlement = async (id) => {
    try {
      await api.post(`/admin/settlements/${id}/reverse`);
      alert('Settlement reversed successfully!');
      fetchEntities();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reverse settlement');
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/coupons', couponForm);
      alert('Coupon created successfully!');
      setShowCreateForm(false);
      fetchEntities();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create coupon');
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/campaigns', campaignForm);
      alert('Campaign created successfully!');
      setShowCreateForm(false);
      fetchEntities();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create campaign');
    }
  };

  // Render Table Columns based on Entity Type
  const renderHeaders = () => {
    switch (entityType) {
      case 'users':
        return (
          <>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Email</th>
            <th className="px-4 py-3 text-left">Role</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-center">Actions</th>
          </>
        );
      case 'vendors':
        return (
          <>
            <th className="px-4 py-3 text-left">Store Name</th>
            <th className="px-4 py-3 text-left">Email</th>
            <th className="px-4 py-3 text-left">Commission Rate</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-center">Actions</th>
          </>
        );
      case 'products':
        return (
          <>
            <th className="px-4 py-3 text-left">Product Name</th>
            <th className="px-4 py-3 text-left">SKU</th>
            <th className="px-4 py-3 text-left">Price</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-center">Actions</th>
          </>
        );
      case 'orders':
        return (
          <>
            <th className="px-4 py-3 text-left">Order Number</th>
            <th className="px-4 py-3 text-left">Customer</th>
            <th className="px-4 py-3 text-left">Total Amount</th>
            <th className="px-4 py-3 text-left">Order Status</th>
          </>
        );
      case 'payments':
        return (
          <>
            <th className="px-4 py-3 text-left">Transaction ID</th>
            <th className="px-4 py-3 text-left">Amount</th>
            <th className="px-4 py-3 text-left">Gateway</th>
            <th className="px-4 py-3 text-left">Status</th>
          </>
        );
      case 'commissions':
        return (
          <>
            <th className="px-4 py-3 text-left">Recipient</th>
            <th className="px-4 py-3 text-left">Source Order</th>
            <th className="px-4 py-3 text-left">Amount</th>
            <th className="px-4 py-3 text-left">Role Split</th>
          </>
        );
      case 'settlements':
        return (
          <>
            <th className="px-4 py-3 text-left">Settlement ID</th>
            <th className="px-4 py-3 text-left">Vendor Store</th>
            <th className="px-4 py-3 text-left">Amount</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-center">Actions</th>
          </>
        );
      case 'coupons':
        return (
          <>
            <th className="px-4 py-3 text-left">Coupon Code</th>
            <th className="px-4 py-3 text-left">Discount</th>
            <th className="px-4 py-3 text-left">Min Purchase</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-center">Actions</th>
          </>
        );
      case 'campaigns':
        return (
          <>
            <th className="px-4 py-3 text-left">Campaign Title</th>
            <th className="px-4 py-3 text-left">Coin Multiplier</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-center">Actions</th>
          </>
        );
      default:
        return (
          <>
            <th className="px-4 py-3 text-left">ID</th>
            <th className="px-4 py-3 text-left">Details</th>
            <th className="px-4 py-3 text-left">Status</th>
          </>
        );
    }
  };

  const renderRow = (item) => {
    switch (entityType) {
      case 'users':
        return (
          <tr key={item._id} className="border-b border-slate-800 hover:bg-slate-900/30">
            <td className="px-4 py-3 text-slate-200">{item.name}</td>
            <td className="px-4 py-3 text-slate-400">{item.email}</td>
            <td className="px-4 py-3 text-purple-400 font-semibold">{item.role}</td>
            <td className="px-4 py-3">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                item.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}>{item.status}</span>
            </td>
            <td className="px-4 py-3 flex justify-center gap-2">
              <button
                onClick={() => handleUpdateStatus(item._id, item.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                className={`p-1 rounded text-white ${item.status === 'ACTIVE' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
                title={item.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
              >
                {item.status === 'ACTIVE' ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              </button>
            </td>
          </tr>
        );
      case 'vendors':
        return (
          <tr key={item._id} className="border-b border-slate-800 hover:bg-slate-900/30">
            <td className="px-4 py-3 text-slate-200">{item.storeName}</td>
            <td className="px-4 py-3 text-slate-400">{item.userId?.email || 'N/A'}</td>
            <td className="px-4 py-3 text-slate-300 font-semibold">{item.commissionRate}%</td>
            <td className="px-4 py-3">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                item.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
              }`}>{item.status}</span>
            </td>
            <td className="px-4 py-3 flex justify-center gap-2">
              <button
                onClick={() => handleUpdateStatus(item._id, 'APPROVED')}
                className="p-1 bg-emerald-600 hover:bg-emerald-500 rounded text-white"
                title="Approve"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleUpdateStatus(item._id, 'SUSPENDED')}
                className="p-1 bg-rose-600 hover:bg-rose-500 rounded text-white"
                title="Suspend"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </td>
          </tr>
        );
      case 'products':
        return (
          <tr key={item._id} className="border-b border-slate-800 hover:bg-slate-900/30">
            <td className="px-4 py-3 text-slate-200">{item.name}</td>
            <td className="px-4 py-3 text-slate-400">{item.sku || 'N/A'}</td>
            <td className="px-4 py-3 text-slate-300">₹{item.price}</td>
            <td className="px-4 py-3">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                item.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}>{item.status}</span>
            </td>
            <td className="px-4 py-3 flex justify-center gap-2">
              <button
                onClick={() => handleUpdateStatus(item._id, 'APPROVED')}
                className="p-1 bg-emerald-600 hover:bg-emerald-500 rounded text-white"
                title="Approve"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleUpdateStatus(item._id, 'REJECTED')}
                className="p-1 bg-rose-600 hover:bg-rose-500 rounded text-white"
                title="Reject"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </td>
          </tr>
        );
      case 'orders':
        return (
          <tr key={item._id} className="border-b border-slate-800 hover:bg-slate-900/30">
            <td className="px-4 py-3 text-slate-200">{item.orderNumber}</td>
            <td className="px-4 py-3 text-slate-400">{item.userId?.name || 'N/A'}</td>
            <td className="px-4 py-3 text-emerald-400">₹{item.totalAmount}</td>
            <td className="px-4 py-3 text-slate-300">{item.orderStatus}</td>
          </tr>
        );
      case 'payments':
        return (
          <tr key={item._id} className="border-b border-slate-800 hover:bg-slate-900/30">
            <td className="px-4 py-3 text-slate-200">{item.transactionId || 'N/A'}</td>
            <td className="px-4 py-3 text-emerald-400">₹{item.amount}</td>
            <td className="px-4 py-3 text-slate-400">{item.gateway}</td>
            <td className="px-4 py-3 text-slate-300">{item.status}</td>
          </tr>
        );
      case 'commissions':
        return (
          <tr key={item._id} className="border-b border-slate-800 hover:bg-slate-900/30">
            <td className="px-4 py-3 text-slate-200">{item.recipientUserId?.name || 'N/A'}</td>
            <td className="px-4 py-3 text-slate-400">{item.orderId?.orderNumber || 'N/A'}</td>
            <td className="px-4 py-3 text-emerald-400">₹{item.amount}</td>
            <td className="px-4 py-3 text-slate-300">{item.recipientRole}</td>
          </tr>
        );
      case 'settlements':
        return (
          <tr key={item._id} className="border-b border-slate-800 hover:bg-slate-900/30">
            <td className="px-4 py-3 text-slate-200">{item._id}</td>
            <td className="px-4 py-3 text-slate-400">{item.vendorId?.storeName || 'N/A'}</td>
            <td className="px-4 py-3 text-emerald-400">₹{item.amount}</td>
            <td className="px-4 py-3">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                item.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}>{item.status}</span>
            </td>
            <td className="px-4 py-3 flex justify-center gap-2">
              <button
                onClick={() => handleUpdateStatus(item._id, 'PAID')}
                className="p-1 bg-emerald-600 hover:bg-emerald-500 rounded text-white"
                title="Mark Paid"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleReverseSettlement(item._id)}
                className="p-1 bg-amber-600 hover:bg-amber-500 rounded text-white"
                title="Reverse"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </td>
          </tr>
        );
      case 'coupons':
        return (
          <tr key={item._id} className="border-b border-slate-800 hover:bg-slate-900/30">
            <td className="px-4 py-3 text-slate-200 font-bold">{item.code}</td>
            <td className="px-4 py-3 text-slate-400">
              {item.discountType === 'PERCENTAGE' ? `${item.discountValue}%` : `₹${item.discountValue}`}
            </td>
            <td className="px-4 py-3 text-slate-300">₹{item.minPurchase}</td>
            <td className="px-4 py-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                {item.isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </td>
            <td className="px-4 py-3 flex justify-center gap-2">
              <button
                onClick={() => handleUpdateStatus(item._id, !item.isActive)}
                className="p-1 bg-purple-650 hover:bg-purple-500 rounded text-white text-xs font-semibold"
              >
                Toggle Status
              </button>
            </td>
          </tr>
        );
      case 'campaigns':
        return (
          <tr key={item._id} className="border-b border-slate-800 hover:bg-slate-900/30">
            <td className="px-4 py-3 text-slate-200">{item.title}</td>
            <td className="px-4 py-3 text-slate-400">{item.multiplier}x Coins</td>
            <td className="px-4 py-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                {item.isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </td>
            <td className="px-4 py-3 flex justify-center gap-2">
              <button
                onClick={() => handleUpdateStatus(item._id, !item.isActive)}
                className="p-1 bg-purple-650 hover:bg-purple-500 rounded text-white text-xs font-semibold"
              >
                Toggle Status
              </button>
            </td>
          </tr>
        );
      default:
        return (
          <tr key={item._id} className="border-b border-slate-800 hover:bg-slate-900/30">
            <td className="px-4 py-3 text-slate-200">{item._id}</td>
            <td className="px-4 py-3 text-slate-400">{JSON.stringify(item)}</td>
            <td className="px-4 py-3 text-slate-350">{item.status || 'N/A'}</td>
          </tr>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold capitalize text-white">{entityType} Management Console</h2>
          <p className="text-xs text-slate-400 mt-0.5">Filter, search, audit records and update administrative statuses.</p>
        </div>

        {/* Create buttons for Coupon & Campaign */}
        {(entityType === 'coupons' || entityType === 'campaigns') && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-purple-650 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all"
          >
            {showCreateForm ? 'Hide Form' : `Create New ${entityType === 'coupons' ? 'Coupon' : 'Campaign'}`}
          </button>
        )}
      </div>

      {/* Creation form */}
      {showCreateForm && entityType === 'coupons' && (
        <form onSubmit={handleCreateCoupon} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl max-w-md space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Configure Coupon</h4>
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">Coupon Code</label>
            <input
              type="text"
              required
              value={couponForm.code}
              onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
              className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-1.5 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Type</label>
              <select
                value={couponForm.discountType}
                onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-1.5 rounded-lg"
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FLAT">Flat (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Value</label>
              <input
                type="number"
                required
                value={couponForm.discountValue}
                onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-1.5 rounded-lg"
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-purple-600 py-2 text-xs font-bold text-white rounded-lg">Save Coupon</button>
        </form>
      )}

      {showCreateForm && entityType === 'campaigns' && (
        <form onSubmit={handleCreateCampaign} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl max-w-md space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Configure Multiplication Campaign</h4>
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">Campaign Title</label>
            <input
              type="text"
              required
              value={campaignForm.title}
              onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-1.5 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">Description</label>
            <input
              type="text"
              required
              value={campaignForm.description}
              onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-1.5 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">Coin Multiplier Ratio</label>
            <input
              type="number"
              required
              value={campaignForm.multiplier}
              onChange={(e) => setCampaignForm({ ...campaignForm, multiplier: Number(e.target.value) })}
              className="w-full bg-slate-800 border border-slate-700 text-xs text-white px-3 py-1.5 rounded-lg"
            />
          </div>
          <button type="submit" className="w-full bg-purple-600 py-2 text-xs font-bold text-white rounded-lg">Launch Campaign</button>
        </form>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder={`Search ${entityType}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>

        {['users', 'vendors', 'products', 'settlements'].includes(entityType) && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="">All Statuses</option>
            {entityType === 'users' && (
              <>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </>
            )}
            {entityType === 'vendors' && (
              <>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="SUSPENDED">Suspended</option>
              </>
            )}
            {entityType === 'products' && (
              <>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
              </>
            )}
            {entityType === 'settlements' && (
              <>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="FAILED">Failed</option>
              </>
            )}
          </select>
        )}
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="min-h-[200px] flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl text-center space-y-1.5">
          <AlertCircle className="w-6 h-6 text-slate-500 mx-auto" />
          <div className="text-xs text-slate-400 font-semibold">No records found.</div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                <tr>{renderHeaders()}</tr>
              </thead>
              <tbody>{items.map(renderRow)}</tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-805 flex justify-between items-center text-xs">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-slate-400">Page {page} of {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminEntityList;
