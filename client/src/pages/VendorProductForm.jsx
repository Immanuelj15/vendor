import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';
import {
  ArrowLeft,
  Package,
  DollarSign,
  Truck,
  Sparkles,
  Check,
  AlertCircle,
  Save,
  Send,
  Layers,
  Info,
  HelpCircle,
  Percent
} from 'lucide-react';

const STEPS = [
  { id: 0, label: 'Basic Info', desc: 'Title, Category, Details', icon: Package },
  { id: 1, label: 'Pricing & Tax', desc: 'MRP, Selling Price, GST', icon: DollarSign },
  { id: 2, label: 'Inventory & Shipping', desc: 'Stock & Dimensions', icon: Truck },
];

export default function VendorProductForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    brand: '',
    shortDescription: '',
    description: '',
    mrp: '',
    price: '',
    taxRate: '18',
    hsnCode: '',
    stock: '',
    lowStockThreshold: '5',
    weight: '',
    weightUnit: 'GRAM',
    length: '',
    width: '',
    height: '',
    dimensionUnit: 'CM',
    images: [],
    imageUrlInput: '',
    status: 'PENDING_APPROVAL'
  });

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchProduct();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      const cats = res.data?.data?.categories || res.data?.data || [];
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (err) {
      console.warn('Failed to load categories directly, trying fallback', err);
      try {
        const res2 = await api.get('/vendor/categories');
        const cats2 = res2.data?.data?.categories || res2.data?.data || [];
        setCategories(Array.isArray(cats2) ? cats2 : []);
      } catch (err2) {
        console.error('Failed to load categories', err2);
      }
    }
  };

  const fetchProduct = async () => {
    try {
      setFetchingProduct(true);
      setError('');
      const res = await api.get(`/vendor/products/${id}`);
      const p = res.data?.data?.product || res.data?.data;
      if (p) {
        setFormData({
          name: p.name || '',
          sku: p.sku || '',
          categoryId: p.categoryId?._id || p.categoryId || '',
          brand: p.brandId?.name || p.brand || '',
          shortDescription: p.shortDescription || '',
          description: p.description || '',
          mrp: p.mrp ? String(p.mrp) : '',
          price: p.price ? String(p.price) : '',
          taxRate: p.taxRate !== undefined ? String(p.taxRate) : '18',
          hsnCode: p.hsnCode || '',
          stock: p.stock !== undefined ? String(p.stock) : '',
          lowStockThreshold: p.lowStockThreshold !== undefined ? String(p.lowStockThreshold) : '5',
          weight: p.weight ? String(p.weight) : '',
          weightUnit: p.weightUnit || 'GRAM',
          length: p.length ? String(p.length) : '',
          width: p.width ? String(p.width) : '',
          height: p.height ? String(p.height) : '',
          dimensionUnit: p.dimensionUnit || 'CM',
          images: p.images || [],
          imageUrlInput: '',
          status: p.status || 'PENDING_APPROVAL'
        });
      }
    } catch (err) {
      console.error('Failed to fetch product:', err);
      setError(err.response?.data?.message || 'Failed to fetch product details.');
    } finally {
      setFetchingProduct(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateSku = () => {
    const prefix = formData.name
      ? formData.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRD')
      : 'SKU';
    const rand = Math.floor(1000 + Math.random() * 9000);
    const time = Date.now().toString().slice(-3);
    setFormData((prev) => ({ ...prev, sku: `${prefix}-${rand}-${time}` }));
  };

  const addImageUrl = () => {
    if (formData.imageUrlInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, prev.imageUrlInput.trim()],
        imageUrlInput: ''
      }));
    }
  };

  const removeImageUrl = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validateCurrentStep = () => {
    if (activeStep === 0) {
      if (!formData.name.trim()) {
        setError('Please enter a valid product name.');
        return false;
      }
      if (!formData.sku.trim()) {
        setError('Please enter or generate a unique SKU.');
        return false;
      }
      if (!formData.categoryId) {
        setError('Please select a category for this product.');
        return false;
      }
    } else if (activeStep === 1) {
      const mrpNum = Number(formData.mrp);
      const priceNum = Number(formData.price);
      if (!formData.mrp || isNaN(mrpNum) || mrpNum <= 0) {
        setError('Please enter a valid Maximum Retail Price (MRP).');
        return false;
      }
      if (!formData.price || isNaN(priceNum) || priceNum <= 0) {
        setError('Please enter a valid Selling Price.');
        return false;
      }
      if (priceNum > mrpNum) {
        setError('Selling price cannot exceed the Maximum Retail Price (MRP).');
        return false;
      }
    } else if (activeStep === 2) {
      const stockNum = Number(formData.stock);
      if (formData.stock === '' || isNaN(stockNum) || stockNum < 0) {
        setError('Please specify available stock quantity (0 or more).');
        return false;
      }
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep((prev) => Math.min(STEPS.length - 1, prev + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setError('');
    setActiveStep((prev) => Math.max(0, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (isDraft = false) => {
    if (!isDraft && !validateCurrentStep()) return;

    try {
      setLoading(true);
      setError('');

      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        categoryId: formData.categoryId,
        shortDescription: formData.shortDescription.trim(),
        description: formData.description.trim(),
        mrp: Number(formData.mrp) || 0,
        price: Number(formData.price) || 0,
        taxRate: Number(formData.taxRate) || 0,
        hsnCode: formData.hsnCode.trim(),
        stock: Number(formData.stock) || 0,
        lowStockThreshold: Number(formData.lowStockThreshold) || 5,
        weight: Number(formData.weight) || 0,
        weightUnit: formData.weightUnit || 'GRAM',
        length: Number(formData.length) || 0,
        width: Number(formData.width) || 0,
        height: Number(formData.height) || 0,
        dimensionUnit: formData.dimensionUnit || 'CM',
        images: formData.images,
        status: isDraft ? 'DRAFT' : 'PENDING_APPROVAL'
      };

      if (isEditing) {
        await api.put(`/vendor/products/${id}`, payload);
      } else {
        await api.post('/vendor/products', payload);
      }

      navigate('/vendor/products');
    } catch (err) {
      console.error('Error saving product:', err);
      setError(err.response?.data?.message || 'Failed to save product. Please verify all fields.');
    } finally {
      setLoading(false);
    }
  };

  const discountPercent =
    formData.mrp && formData.price && Number(formData.mrp) > Number(formData.price)
      ? Math.round(((Number(formData.mrp) - Number(formData.price)) / Number(formData.mrp)) * 100)
      : null;

  if (fetchingProduct) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-500">Loading product information...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/vendor/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Products
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Fill in the details below to list your item on the store catalog.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            Save as Draft
          </button>
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isDone = activeStep > step.id;
            const isCurrent = activeStep === step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (activeStep > step.id) setActiveStep(step.id);
                }}
                disabled={activeStep < step.id}
                className={`text-left p-3 sm:p-4 rounded-xl transition-all border ${
                  isCurrent
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : isDone
                    ? 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/60 cursor-pointer'
                    : 'border-slate-100 bg-slate-50/60 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : step.id + 1}
                  </div>
                  <div className="min-w-0 hidden sm:block">
                    <div className="text-xs font-semibold text-slate-900 truncate">{step.label}</div>
                    <div className="text-[11px] text-slate-500 truncate">{step.desc}</div>
                  </div>
                </div>
              </button>
            );
          })}
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

      {/* Form Content Container */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Step 1: Basic Info */}
        {activeStep === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Basic Information</h2>
              <p className="text-xs text-slate-500 mt-0.5">Define how this product appears to customers</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Product Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Wireless Noise-Cancelling Headphones"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* SKU */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  SKU (Stock Keeping Unit) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="e.g. WNH-001"
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-slate-800 placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={generateSku}
                    className="px-3 py-2.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1 shadow-sm"
                    title="Generate unique SKU"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Auto
                  </button>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 cursor-pointer"
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                  {categories.length === 0 && (
                    <option value="65e8a1f2b3c4d5e6f7a8b9c0">General / Default Category</option>
                  )}
                </select>
              </div>

              {/* Short Description */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Short Description
                </label>
                <textarea
                  name="shortDescription"
                  rows={2}
                  value={formData.shortDescription}
                  onChange={handleChange}
                  placeholder="Brief 1-2 sentence overview of key features..."
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* Full Description */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Full Description & Specifications
                </label>
                <textarea
                  name="description"
                  rows={5}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Detailed product information, features, materials, warranty, and technical specs..."
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* Product Images (URLs) */}
              <div className="sm:col-span-2 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Product Image URLs
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={formData.imageUrlInput}
                    onChange={(e) => setFormData({ ...formData, imageUrlInput: e.target.value })}
                    placeholder="https://example.com/images/product.jpg"
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={addImageUrl}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors whitespace-nowrap"
                  >
                    Add Image
                  </button>
                </div>

                {formData.images.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-3">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative group w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                        <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImageUrl(idx)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Pricing & Tax */}
        {activeStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Pricing & Taxation</h2>
              <p className="text-xs text-slate-500 mt-0.5">Configure prices, discounts, and GST compliance</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* MRP */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Maximum Retail Price (MRP ₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                  <input
                    type="number"
                    name="mrp"
                    min="0"
                    step="0.01"
                    value={formData.mrp}
                    onChange={handleChange}
                    placeholder="999"
                    className="w-full pl-8 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Selling Price */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Selling Price (Discounted ₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="799"
                    className="w-full pl-8 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Live Discount Indicator */}
              {discountPercent !== null && (
                <div className="sm:col-span-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-emerald-600" />
                    <span>Customer Discount: <strong className="font-bold">{discountPercent}% OFF</strong></span>
                  </div>
                  <span>
                    Savings: <strong>₹{(Number(formData.mrp) - Number(formData.price)).toFixed(2)}</strong>
                  </span>
                </div>
              )}

              {/* Tax Rate */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  GST Tax Rate (%)
                </label>
                <select
                  name="taxRate"
                  value={formData.taxRate}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 cursor-pointer"
                >
                  <option value="0">0% (Nil / Exempted)</option>
                  <option value="5">5% (Essentials / Concessional)</option>
                  <option value="12">12% (Standard I)</option>
                  <option value="18">18% (Standard II - Most Goods)</option>
                  <option value="28">28% (Luxury / Higher Bracket)</option>
                </select>
              </div>

              {/* HSN Code */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  HSN / SAC Code
                </label>
                <input
                  type="text"
                  name="hsnCode"
                  value={formData.hsnCode}
                  onChange={handleChange}
                  placeholder="e.g. 85183000"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Inventory & Shipping */}
        {activeStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Inventory & Logistics</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage quantities, stock alerts, and package parcel metrics</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Stock Quantity */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Available Stock Quantity <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="stock"
                  min="0"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="e.g. 100"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* Low Stock Alert Threshold */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Low Stock Alert Threshold
                </label>
                <input
                  type="number"
                  name="lowStockThreshold"
                  min="1"
                  value={formData.lowStockThreshold}
                  onChange={handleChange}
                  placeholder="e.g. 5"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* Shipping Weight */}
              <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Package Weight
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <input
                      type="number"
                      name="weight"
                      min="0"
                      step="0.01"
                      value={formData.weight}
                      onChange={handleChange}
                      placeholder="e.g. 250"
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <select
                      name="weightUnit"
                      value={formData.weightUnit}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 cursor-pointer"
                    >
                      <option value="GRAM">Grams (g)</option>
                      <option value="KG">Kilograms (kg)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Package Dimensions */}
              <div className="sm:col-span-2 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Package Dimensions (Length × Width × Height in cm)
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Length (cm)</label>
                    <input
                      type="number"
                      name="length"
                      min="0"
                      step="0.1"
                      value={formData.length}
                      onChange={handleChange}
                      placeholder="L"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Width (cm)</label>
                    <input
                      type="number"
                      name="width"
                      min="0"
                      step="0.1"
                      value={formData.width}
                      onChange={handleChange}
                      placeholder="W"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Height (cm)</label>
                    <input
                      type="number"
                      name="height"
                      min="0"
                      step="0.1"
                      value={formData.height}
                      onChange={handleChange}
                      placeholder="H"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-8 mt-8 border-t border-slate-100">
          <button
            type="button"
            onClick={handleBack}
            disabled={activeStep === 0 || loading}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm transition-colors"
          >
            Back
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              Save as Draft
            </button>

            {activeStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md shadow-blue-500/20 transition-all"
              >
                Next Step
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-sm shadow-md shadow-blue-500/25 hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {isEditing ? 'Update & Submit' : 'Submit for Approval'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
