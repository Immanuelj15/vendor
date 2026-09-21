import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import {
  Plus,
  Search,
  Filter,
  Package,
  CheckCircle2,
  Clock,
  FileEdit,
  AlertTriangle,
  XCircle,
  Eye,
  Pencil,
  Trash2,
  RefreshCw,
  TrendingUp,
  Tag,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Layers
} from 'lucide-react';

export default function VendorProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    ACTIVE: 0,
    PENDING_APPROVAL: 0,
    DRAFT: 0,
    REJECTED: 0,
    INACTIVE: 0
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Delete Dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, [page, search, statusFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');

      const queryParams = new URLSearchParams({ page });
      if (search.trim()) queryParams.append('search', search.trim());
      if (statusFilter) queryParams.append('status', statusFilter);

      const res = await api.get(`/vendor/products?${queryParams.toString()}`);
      const data = res.data?.data || {};
      setProducts(data.products || []);
      setStats(data.stats || {
        total: 0,
        ACTIVE: 0,
        PENDING_APPROVAL: 0,
        DRAFT: 0,
        REJECTED: 0,
        INACTIVE: 0
      });
      setTotalPages(data.pages || 1);
    } catch (err) {
      console.error('Failed to fetch vendor products:', err);
      setError(err.response?.data?.message || 'Failed to fetch products. Please ensure your vendor profile is approved.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (productId, newStatus) => {
    try {
      setActionLoading(true);
      setError('');
      await api.post(`/vendor/products/${productId}/status`, { status: newStatus });
      setSuccessMsg(`Product status updated to ${newStatus.replace('_', ' ')}`);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update product status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      setActionLoading(true);
      setError('');
      await api.delete(`/vendor/products/${productToDelete._id}`);
      setDeleteOpen(false);
      setProductToDelete(null);
      setSuccessMsg('Product removed successfully');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setActionLoading(false);
    }
  };

  const statusConfig = {
    ACTIVE: {
      label: 'Active',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      icon: CheckCircle2
    },
    PENDING_APPROVAL: {
      label: 'Pending Approval',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500 animate-pulse',
      icon: Clock
    },
    DRAFT: {
      label: 'Draft',
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
      icon: FileEdit
    },
    REJECTED: {
      label: 'Rejected',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
      icon: XCircle
    },
    INACTIVE: {
      label: 'Inactive',
      bg: 'bg-zinc-100 text-zinc-600 border-zinc-200',
      dot: 'bg-zinc-400',
      icon: AlertTriangle
    }
  };

  const statCards = [
    { key: '', label: 'Total Products', count: stats.total || 0, icon: Package, color: 'from-blue-500 to-indigo-600', textColor: 'text-blue-600', bgLight: 'bg-blue-50' },
    { key: 'ACTIVE', label: 'Active', count: stats.ACTIVE || 0, icon: CheckCircle2, color: 'from-emerald-500 to-teal-600', textColor: 'text-emerald-600', bgLight: 'bg-emerald-50' },
    { key: 'PENDING_APPROVAL', label: 'Pending Approval', count: stats.PENDING_APPROVAL || 0, icon: Clock, color: 'from-amber-500 to-orange-600', textColor: 'text-amber-600', bgLight: 'bg-amber-50' },
    { key: 'DRAFT', label: 'Drafts', count: stats.DRAFT || 0, icon: FileEdit, color: 'from-slate-500 to-slate-700', textColor: 'text-slate-600', bgLight: 'bg-slate-100' },
    { key: 'REJECTED', label: 'Rejected', count: stats.REJECTED || 0, icon: XCircle, color: 'from-rose-500 to-red-600', textColor: 'text-rose-600', bgLight: 'bg-rose-50' }
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">My Products</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {stats.total || 0} Total
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage your inventory, pricing, approval status, and catalog items.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchProducts()}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/vendor/products/new')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3 shadow-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-rose-500" />
          <div className="flex-1 text-sm font-medium">{error}</div>
          <button onClick={() => setError('')} className="text-rose-400 hover:text-rose-600 font-bold">×</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-emerald-600" />
          <div className="flex-1 text-sm font-medium">{successMsg}</div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700 font-bold">×</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {statCards.map((card) => {
          const Icon = card.icon;
          const isSelected = statusFilter === card.key;
          return (
            <button
              key={card.label}
              onClick={() => {
                setStatusFilter(isSelected ? '' : card.key);
                setPage(1);
              }}
              className={`text-left p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden bg-white ${
                isSelected
                  ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                  : 'border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500">{card.label}</span>
                <div className={`p-1.5 rounded-lg ${card.bgLight} ${card.textColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {card.count}
              </div>
              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or tags..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-48">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-8 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 appearance-none font-medium cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="DRAFT">Draft</option>
              <option value="INACTIVE">Inactive</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {(search || statusFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setPage(1);
              }}
              className="px-3 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Product Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading && products.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-500">Loading your catalog...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 px-4 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">No products found</h3>
              <p className="text-sm text-slate-500 mt-1">
                {search || statusFilter
                  ? 'No products match your current filters. Try resetting the search or filter query.'
                  : 'You have not added any products yet. Start listing products to begin selling.'}
              </p>
            </div>
            {search || statusFilter ? (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                }}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => navigate('/vendor/products/new')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md shadow-blue-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Your First Product
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 sm:px-6">Product Details</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Pricing</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {products.map((product) => {
                  const statusInfo = statusConfig[product.status] || {
                    label: product.status,
                    bg: 'bg-slate-100 text-slate-700 border-slate-200',
                    dot: 'bg-slate-400',
                    icon: AlertCircle
                  };
                  const StatusIcon = statusInfo.icon;

                  const isLowStock = product.stock <= (product.lowStockThreshold || 5);
                  const isOutOfStock = product.stock <= 0;

                  return (
                    <tr
                      key={product._id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Product Name & Category */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-400">
                            {product.images && product.images[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-6 h-6 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/vendor/products/${product._id}/edit`}
                              className="font-semibold text-slate-900 hover:text-blue-600 transition-colors block truncate max-w-xs sm:max-w-sm"
                            >
                              {product.name}
                            </Link>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              <span>{product.categoryId?.name || 'General Category'}</span>
                              {product.brandId?.name && (
                                <>
                                  <span>•</span>
                                  <span>{product.brandId.name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-4 px-4">
                        <span className="font-mono text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60 font-semibold">
                          {product.sku || 'N/A'}
                        </span>
                      </td>

                      {/* Price & MRP */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-900">
                          ₹{Number(product.price).toLocaleString('en-IN')}
                        </div>
                        {product.mrp > product.price && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="line-through text-slate-400">
                              ₹{Number(product.mrp).toLocaleString('en-IN')}
                            </span>
                            <span className="font-semibold text-emerald-600 text-[11px]">
                              {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-4 px-4">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                              isOutOfStock
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : isLowStock
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {isOutOfStock ? '0 (Out of stock)' : `${product.stock} units`}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                          {statusInfo.label}
                        </span>
                        {product.status === 'REJECTED' && product.rejectionReason && (
                          <div className="text-[11px] text-rose-600 mt-1 max-w-xs truncate" title={product.rejectionReason}>
                            Reason: {product.rejectionReason}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/vendor/products/${product._id}/edit`}
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit product"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>

                          {product.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleStatusChange(product._id, 'INACTIVE')}
                              disabled={actionLoading}
                              className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                            >
                              Deactivate
                            </button>
                          )}

                          {product.status === 'INACTIVE' && (
                            <button
                              onClick={() => handleStatusChange(product._id, 'ACTIVE')}
                              disabled={actionLoading}
                              className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                            >
                              Activate
                            </button>
                          )}

                          {(product.status === 'DRAFT' || product.status === 'REJECTED') && (
                            <button
                              onClick={() => handleStatusChange(product._id, 'PENDING_APPROVAL')}
                              disabled={actionLoading}
                              className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              Submit
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setProductToDelete(product);
                              setDeleteOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="py-4 px-6 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="text-xs text-slate-500 font-medium">
              Page <span className="font-semibold text-slate-800">{page}</span> of{' '}
              <span className="font-semibold text-slate-800">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteOpen && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete Product</h3>
              <p className="text-sm text-slate-500 mt-1">
                Are you sure you want to remove <span className="font-semibold text-slate-800">"{productToDelete.name}"</span>? This will archive the product and remove it from store listings.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteOpen(false);
                  setProductToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-500/20 transition-all flex items-center gap-2"
              >
                {actionLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
