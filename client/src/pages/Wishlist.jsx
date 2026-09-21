import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Heart, ShoppingCart, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const Wishlist = () => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [addingCartId, setAddingCartId] = useState(null);

  const loadWishlist = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/wishlist');
      if (res.data?.success) {
        setWishlist(res.data.data.wishlist);
      }
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      const res = await api.post('/wishlist', { productId });
      if (res.data?.success) {
        setWishlist(res.data.data.wishlist);
      }
    } catch (err) {
      console.error('Failed to remove product from wishlist:', err);
    }
  };

  const handleAddToCart = async (productId) => {
    setAddingCartId(productId);
    try {
      await api.post('/cart/add', { productId, quantity: 1 });
      alert('Product added to cart!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add item to cart');
      navigate('/login');
    } finally {
      setAddingCartId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-xs">
          <div className="border-b border-slate-100 pb-5 mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
                <span>My Saved Wishlist</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">Keep track of your favorite marketplace products</p>
            </div>
            {wishlist?.products?.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                {wishlist.products.length} Saved Item(s)
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              <div className="h-64 bg-slate-100 rounded-2xl"></div>
              <div className="h-64 bg-slate-100 rounded-2xl"></div>
              <div className="h-64 bg-slate-100 rounded-2xl"></div>
            </div>
          ) : !wishlist || wishlist.products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center mb-4">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Your wishlist is currently empty</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Explore products across our multi-vendor catalog and click the heart icon to save items here.
              </p>
              <Link
                to="/products"
                className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl shadow-md shadow-blue-500/20 transition-all inline-flex items-center gap-2"
              >
                <span>Browse Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.products.map((product) => (
                <motion.div
                  key={product._id}
                  whileHover={{ y: -3 }}
                  className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Product Image */}
                    <div className="h-48 bg-slate-50 flex items-center justify-center relative overflow-hidden border-b border-slate-100">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">No Image Available</span>
                      )}
                      <button
                        onClick={() => handleRemove(product._id)}
                        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors shadow-xs"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <Link
                        to={`/products/${product.slug || product._id}`}
                        className="font-bold text-slate-900 text-sm hover:text-blue-600 line-clamp-1 transition-colors"
                      >
                        {product.name}
                      </Link>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {product.description || 'Verified product from certified seller'}
                      </p>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-base font-black text-slate-900">
                          ₹{product.price?.toLocaleString()}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-xs text-slate-400 line-through">
                            ₹{product.originalPrice?.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => handleAddToCart(product._id)}
                      disabled={addingCartId === product._id}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {addingCartId === product._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          <span>Move to Cart</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
  );
};

export default Wishlist;
