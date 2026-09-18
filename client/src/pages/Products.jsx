import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Search, Filter, ShoppingBag, Coins, Star, ArrowUpDown, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistProductIds, setWishlistProductIds] = useState([]);
  
  // Pagination stats
  const [totalPages, setTotalPages] = useState(1);
  const currentPage = parseInt(searchParams.get('page')) || 1;

  // Filter States synced with URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [rating, setRating] = useState(searchParams.get('rating') || '');
  const [availability, setAvailability] = useState(searchParams.get('availability') || 'all');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');

  useEffect(() => {
    fetchWishlist();
    fetchCategories();
    fetchBrands();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchParams]);

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/wishlist');
      if (res.data?.success && res.data.data.wishlist) {
        setWishlistProductIds(res.data.data.wishlist.products.map(p => p._id));
      }
    } catch (e) {
      // Not logged in
    }
  };

  const handleToggleWishlist = async (productId) => {
    try {
      const res = await api.post('/wishlist', { productId });
      if (res.data?.success && res.data.data.wishlist) {
        setWishlistProductIds(res.data.data.wishlist.products.map(p => p._id));
      }
    } catch (err) {
      alert('Please login to manage wishlist');
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data.categories || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await api.get('/brands');
      setBrands(res.data.data.brands || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 9,
      };

      if (searchParams.get('search')) params.search = searchParams.get('search');
      if (searchParams.get('category')) params.category = searchParams.get('category');
      if (searchParams.get('brand')) params.brand = searchParams.get('brand');
      if (searchParams.get('minPrice')) params.minPrice = Number(searchParams.get('minPrice')) * 100; // in paise
      if (searchParams.get('maxPrice')) params.maxPrice = Number(searchParams.get('maxPrice')) * 100;
      if (searchParams.get('rating')) params.rating = Number(searchParams.get('rating'));
      if (searchParams.get('availability')) params.availability = searchParams.get('availability');
      if (searchParams.get('sort')) params.sort = searchParams.get('sort');

      const res = await api.get('/products', { params });
      setProducts(res.data.data.products || []);
      setTotalPages(res.data.data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (newParams) => {
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (search) newParams.set('search', search);
    else newParams.delete('search');
    applyFilters(newParams);
  };

  const handleCategoryChange = (slug) => {
    setSelectedCategory(slug);
    const newParams = new URLSearchParams(searchParams);
    if (slug) newParams.set('category', slug);
    else newParams.delete('category');
    applyFilters(newParams);
  };

  const handleBrandChange = (slug) => {
    setSelectedBrand(slug);
    const newParams = new URLSearchParams(searchParams);
    if (slug) newParams.set('brand', slug);
    else newParams.delete('brand');
    applyFilters(newParams);
  };

  const handlePriceApply = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (minPrice) newParams.set('minPrice', minPrice);
    else newParams.delete('minPrice');
    
    if (maxPrice) newParams.set('maxPrice', maxPrice);
    else newParams.delete('maxPrice');
    applyFilters(newParams);
  };

  const handleRatingChange = (stars) => {
    setRating(stars);
    const newParams = new URLSearchParams(searchParams);
    if (stars) newParams.set('rating', stars);
    else newParams.delete('rating');
    applyFilters(newParams);
  };

  const handleStockChange = (e) => {
    const isChecked = e.target.checked;
    const value = isChecked ? 'in_stock' : 'all';
    setAvailability(value);
    const newParams = new URLSearchParams(searchParams);
    if (value !== 'all') newParams.set('availability', value);
    else newParams.delete('availability');
    applyFilters(newParams);
  };

  const handleSortChange = (newSort) => {
    setSort(newSort);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', newSort);
    setSearchParams(newParams);
  };

  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setRating('');
    setAvailability('all');
    setSort('newest');
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Marketplace Catalog</h1>
          <p className="text-xs text-slate-500 mt-1">Explore verified vendor products and earn Fair Coins on every order</p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1 md:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-slate-50 text-xs text-slate-800 placeholder-slate-400 rounded-xl py-2.5 pl-9 pr-4 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            Search
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" />
                <span>Filters</span>
              </h3>
              <button 
                onClick={clearFilters} 
                className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold transition-colors underline"
              >
                Clear All
              </button>
            </div>

            {/* Categories */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Categories</h4>
              <div className="space-y-1 text-xs max-h-40 overflow-y-auto pr-1">
                <button
                  onClick={() => handleCategoryChange('')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors font-semibold ${
                    !selectedCategory ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => handleCategoryChange(cat.slug)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors font-semibold ${
                      selectedCategory === cat.slug ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Brands */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Brands</h4>
              <div className="space-y-1 text-xs max-h-40 overflow-y-auto pr-1">
                <button
                  onClick={() => handleBrandChange('')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors font-semibold ${
                    !selectedBrand ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  All Brands
                </button>
                {brands.map((b) => (
                  <button
                    key={b._id}
                    onClick={() => handleBrandChange(b.slug)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors font-semibold ${
                      selectedBrand === b.slug ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Price Range (₹)</h4>
              <form onSubmit={handlePriceApply} className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full bg-slate-50 text-xs text-slate-800 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-slate-50 text-xs text-slate-800 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
                <button type="submit" className="px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg hover:bg-blue-100">
                  Go
                </button>
              </form>
            </div>

            {/* Ratings */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Minimum Rating</h4>
              <div className="flex flex-col gap-1">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <button
                    key={stars}
                    onClick={() => handleRatingChange(stars.toString())}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg text-left transition-colors font-medium ${
                      rating === stars.toString() ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < stars ? 'fill-current' : 'text-slate-300'}`} />
                      ))}
                    </div>
                    <span>{stars} Stars & Up</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={availability === 'in_stock'}
                  onChange={handleStockChange}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <span>Exclude Out of Stock</span>
              </label>
            </div>
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="lg:col-span-3 space-y-6">
          {/* Sorting panel */}
          <div className="flex justify-between items-center bg-white border border-slate-200/80 px-4 py-3 rounded-xl shadow-xs">
            <span className="text-xs text-slate-500 font-medium">
              Showing Page <strong className="text-slate-900">{currentPage}</strong> of <strong className="text-slate-900">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-2 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="popular">Popularity</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <div key={n} className="bg-white border border-slate-200 rounded-2xl p-4 h-80 animate-pulse shadow-xs" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-xs">
              <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No products found</h3>
              <p className="text-xs text-slate-500">Try adjusting your filters or search keywords.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((prod) => {
                  const hasDiscount = prod.discountPrice > 0;
                  return (
                    <motion.div
                      key={prod._id}
                      whileHover={{ y: -4 }}
                      className="bg-white border border-slate-200/80 hover:border-blue-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                    >
                      <Link to={`/products/${prod.slug}`} className="block relative aspect-square bg-slate-100 overflow-hidden group">
                        <img
                          src={prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        
                        {/* Wishlist Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleWishlist(prod._id);
                          }}
                          className="absolute top-3 left-3 p-1.5 rounded-full bg-white/90 hover:bg-white border border-slate-200 shadow-xs transition-colors text-slate-600 z-10"
                          title="Add to Wishlist"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              wishlistProductIds.includes(prod._id) ? 'text-rose-500 fill-rose-500' : 'text-slate-400'
                            }`}
                          />
                        </button>

                        <div className="absolute top-3 right-3 bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-xs">
                          <Coins className="w-3.5 h-3.5 text-amber-500" />
                          <span>+{prod.coinReward || 10} Coins</span>
                        </div>
                      </Link>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="text-[10px] text-blue-600 font-bold mb-1 uppercase tracking-wider">
                            {prod.vendorId?.storeName || 'Verified Vendor'}
                          </div>
                          <Link to={`/products/${prod.slug}`} className="font-bold text-sm text-slate-900 hover:text-blue-600 line-clamp-1 transition-colors">
                            {prod.name}
                          </Link>
                          
                          {/* Rating snippet */}
                          <div className="flex items-center gap-1 mt-1 text-slate-500 text-[10px]">
                            <Star className="w-3 h-3 text-amber-500 fill-current" />
                            <span className="font-bold text-slate-800">{prod.rating || '0.0'}</span>
                            <span>({prod.reviewCount || 0} reviews)</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div>
                            {hasDiscount ? (
                              <>
                                <div className="text-base font-black text-slate-900">₹{(prod.discountPrice / 100).toFixed(2)}</div>
                                <div className="text-xs text-slate-400 line-through">₹{(prod.price / 100).toFixed(2)}</div>
                              </>
                            ) : (
                              <div className="text-base font-black text-slate-900">₹{(prod.price / 100).toFixed(2)}</div>
                            )}
                          </div>

                          <Link
                            to={`/products/${prod.slug}`}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-6 border-t border-slate-200">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold disabled:opacity-50 disabled:pointer-events-none shadow-xs"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                          currentPage === pageNum ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold disabled:opacity-50 disabled:pointer-events-none shadow-xs"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
