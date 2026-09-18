import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ShoppingBag, Coins, Store, ShieldCheck, CheckCircle2, Loader2, ArrowLeft, Star, Heart, Check } from 'lucide-react';

export const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // Variant State
  const [selectedVariantSku, setSelectedVariantSku] = useState('');

  // Reviews and summary state
  const [reviews, setReviews] = useState([]);
  const [reviewsSummary, setReviewsSummary] = useState({ averageRating: 0, totalReviews: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPages, setReviewPages] = useState(1);

  // New Review Form State
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [reviewImages, setReviewImages] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');
  const [reviewErrorMsg, setReviewErrorMsg] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products/${slug}`);
      const prod = res.data.data.product;
      setProduct(prod);
      
      // Auto-select first variant SKU if available
      if (prod.variants && prod.variants.length > 0) {
        setSelectedVariantSku(prod.variants[0].sku);
      }
      
      // Fetch reviews once product is loaded
      fetchReviews(prod._id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (productId, page = 1) => {
    setReviewsLoading(true);
    try {
      const res = await api.get(`/reviews/product/${productId}`, { params: { page, limit: 5 } });
      if (res.data?.success) {
        setReviews(res.data.data.reviews || []);
        setReviewsSummary(res.data.data.summary || { averageRating: 0, totalReviews: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
        setReviewPages(res.data.data.pages || 1);
        setReviewPage(page);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const getActiveDetails = () => {
    if (!product) return null;
    
    let name = product.name;
    let originalPrice = product.price;
    let discountPrice = product.discountPrice || 0;
    let sellingPrice = discountPrice > 0 ? discountPrice : originalPrice;
    let stock = product.stock;
    let sku = product.sku;
    let image = product.images?.[0] || '';

    if (selectedVariantSku && product.variants && product.variants.length > 0) {
      const variant = product.variants.find((v) => v.sku === selectedVariantSku);
      if (variant) {
        name = `${product.name} - ${variant.name}`;
        originalPrice = variant.price;
        discountPrice = variant.discountPrice || 0;
        sellingPrice = discountPrice > 0 ? discountPrice : originalPrice;
        stock = variant.stock;
        sku = variant.sku;
        if (variant.images && variant.images.length > 0) {
          image = variant.images[0];
        }
      }
    }

    return { name, price: originalPrice, discountPrice, sellingPrice, stock, sku, image };
  };

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await api.post('/cart/add', {
        productId: product._id,
        quantity: 1,
        variantSku: selectedVariantSku || undefined,
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    setReviewSuccessMsg('');
    setReviewErrorMsg('');

    try {
      const imageArray = reviewImages
        ? reviewImages.split(',').map((u) => u.trim()).filter(Boolean)
        : [];

      const res = await api.post('/reviews', {
        productId: product._id,
        rating,
        title: reviewTitle,
        comment: reviewBody,
        images: imageArray,
      });

      if (res.data?.success) {
        setReviewSuccessMsg('Your verified review has been published!');
        setReviewTitle('');
        setReviewBody('');
        setReviewImages('');
        setRating(5);
        fetchReviews(product._id, 1);
      }
    } catch (err) {
      setReviewErrorMsg(err.response?.data?.message || 'Failed to submit review. You must have purchased this item.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        Product not found.
      </div>
    );
  }

  const details = getActiveDetails();
  const totalReviewsCount = reviewsSummary.totalReviews || 1;
  const ratingAvg = reviewsSummary.averageRating || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 font-semibold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Catalog</span>
      </button>

      {/* Main product card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white border border-slate-200/80 p-8 rounded-3xl shadow-sm">
        {/* Product Image */}
        <div className="relative aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
          <img
            src={details.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'}
            alt={details.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs">
            <Coins className="w-4 h-4 text-amber-500" />
            <span>Earn +{product.coinReward || 10} Fair Coins</span>
          </div>
        </div>

        {/* Product details info */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              <Store className="w-3.5 h-3.5" />
              <span>Seller: {product.vendorId?.storeName || 'FairKart Verified'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{details.name}</h1>

            {/* Ratings Header */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="flex text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(ratingAvg) ? 'fill-current' : 'text-slate-300'}`} />
                ))}
              </div>
              <span className="font-bold text-slate-800">{ratingAvg.toFixed(1)}</span>
              <span>({reviewsSummary.totalReviews} reviews)</span>
            </div>

            {/* Price display */}
            <div className="flex items-baseline gap-3">
              {details.discountPrice > 0 ? (
                <>
                  <span className="text-3xl font-black text-slate-900">₹{(details.discountPrice / 100).toFixed(2)}</span>
                  <span className="text-sm text-slate-400 line-through">₹{(details.price / 100).toFixed(2)}</span>
                </>
              ) : (
                <span className="text-3xl font-black text-slate-900">₹{(details.price / 100).toFixed(2)}</span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
              {product.description || 'High quality verified marketplace product.'}
            </p>

            {/* SKU and stock details */}
            <div className="text-[10px] text-slate-500 space-y-1">
              <div>SKU: <span className="text-slate-800 font-mono font-bold">{details.sku || 'N/A'}</span></div>
              <div>Availability: {details.stock > 0 ? (
                <span className="text-emerald-600 font-bold">In Stock ({details.stock} available)</span>
              ) : (
                <span className="text-rose-600 font-bold">Out of Stock</span>
              )}</div>
            </div>

            {/* Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700">Choose Option:</label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.sku}
                      onClick={() => setSelectedVariantSku(v.sku)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        selectedVariantSku === v.sku
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {v.name} (₹{(v.discountPrice > 0 ? v.discountPrice : v.price) / 100})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <button
              onClick={handleAddToCart}
              disabled={adding || details.stock <= 0}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {adding ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : added ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  <span>Added to Shopping Cart!</span>
                </>
              ) : details.stock <= 0 ? (
                <span>Out of Stock</span>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  <span>Add to Shopping Cart</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-medium">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Verified Vendor Product</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-medium">
                <Coins className="w-4 h-4 text-amber-500" />
                <span>Instant Fair Coins Reward</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ratings & reviews section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Rating Summaries */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Customer Reviews</h3>
            
            <div className="text-center py-4 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
              <div className="text-3xl font-black text-slate-900">{ratingAvg.toFixed(1)}</div>
              <div className="flex justify-center text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(ratingAvg) ? 'fill-current' : 'text-slate-300'}`} />
                ))}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Based on {reviewsSummary.totalReviews} reviews</div>
            </div>

            {/* Stars Progress bars */}
            <div className="space-y-2 text-xs">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviewsSummary.distribution[stars] || 0;
                const percentage = Math.round((count / totalReviewsCount) * 100);
                return (
                  <div key={stars} className="flex items-center gap-2 text-slate-600">
                    <span className="w-3 text-right font-medium">{stars}</span>
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span className="w-8 text-right text-[10px] text-slate-400">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Review Form */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Write a Review</h3>
            <p className="text-[11px] text-slate-500">Share your shopping feedback to help other buyers. Only verified purchases qualify.</p>

            <form onSubmit={handleReviewSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-600 font-bold mb-1">Rating Stars</label>
                <div className="flex gap-1 text-amber-500 cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="hover:scale-110 transition-transform"
                    >
                      <Star className={`w-5 h-5 ${star <= rating ? 'fill-current' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 font-bold mb-1">Review Title</label>
                <input
                  type="text"
                  placeholder="Summarize your review"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full bg-slate-50 text-xs text-slate-800 p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 font-bold mb-1">Review Details</label>
                <textarea
                  rows="3"
                  placeholder="What did you like or dislike? Write at least 5 characters."
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  className="w-full bg-slate-50 text-xs text-slate-800 p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white"
                ></textarea>
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 font-bold mb-1">Product Image URLs (optional)</label>
                <input
                  type="text"
                  placeholder="https://image1.jpg, https://image2.jpg"
                  value={reviewImages}
                  onChange={(e) => setReviewImages(e.target.value)}
                  className="w-full bg-slate-50 text-xs text-slate-800 p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              {reviewSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200 font-medium">
                  {reviewSuccessMsg}
                </div>
              )}
              {reviewErrorMsg && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 font-medium">
                  {reviewErrorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                {submittingReview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm min-h-[40vh] space-y-6">
            <h3 className="font-bold text-sm text-slate-900">Review Logs ({reviewsSummary.totalReviews})</h3>

            {reviewsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                No reviews yet for this product. Be the first to share your thoughts!
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((rev) => (
                  <div key={rev._id} className="pb-6 border-b border-slate-100 last:border-0 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-700 font-bold border border-blue-200">
                          {rev.userId?.name?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{rev.userId?.name || 'Customer'}</div>
                          <div className="text-[10px] text-slate-400">{new Date(rev.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>

                      <div className="flex text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'fill-current' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {rev.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">
                          <Check className="w-3 h-3" />
                          <span>Verified Purchase</span>
                        </span>
                      )}
                    </div>

                    <div>
                      {rev.title && <h5 className="text-xs font-bold text-slate-800 mb-1">{rev.title}</h5>}
                      <p className="text-xs text-slate-600 leading-relaxed">{rev.comment || rev.body}</p>
                    </div>

                    {rev.images && rev.images.length > 0 && (
                      <div className="flex gap-2 pt-2 overflow-x-auto">
                        {rev.images.map((img, idx) => (
                          <a key={idx} href={img} target="_blank" rel="noreferrer" className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={img} alt="review attachment" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {reviewPages > 1 && (
                  <div className="flex items-center gap-2 justify-end pt-2">
                    <button
                      onClick={() => fetchReviews(product._id, reviewPage - 1)}
                      disabled={reviewPage === 1}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold rounded hover:bg-slate-100 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <span className="text-[10px] text-slate-500">Page {reviewPage} of {reviewPages}</span>
                    <button
                      onClick={() => fetchReviews(product._id, reviewPage + 1)}
                      disabled={reviewPage === reviewPages}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold rounded hover:bg-slate-100 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
