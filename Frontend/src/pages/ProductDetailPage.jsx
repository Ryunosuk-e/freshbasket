import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MapPin,
  MessageSquare,
  Minus,
  Package,
  Plus,
  Send,
  ShoppingCart,
  Star,
  Store,
  Sparkles,
} from 'lucide-react';
import PublicHeader from '../components/PublicHeader.jsx';
import Footer from '../components/Footer.jsx';
import { getProduct, getProductRecommendations } from '../api/products.js';
import { addToCart } from '../api/cart.js';
import { getProductReviews, submitReview } from '../api/reviews.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { getProductImageUrl, handleImageFallback } from '../utils/productImages.js';

function formatNaira(price) {
  const amount = Number(price);
  return `\u20a6${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function ProductDetailPage() {
  const { productId } = useParams();
  const { isAuthenticated, user, token } = useAuth();
  const { refreshCart } = useCart();
  const isCustomer = isAuthenticated && user?.role === 'customer';

  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  // Packaging and Quantity Selection (FR03 / FR04 / User Request)
  const [selectedPackaging, setSelectedPackaging] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Cart action state
  const [isAdding, setIsAdding] = useState(false);
  const [cartMessage, setCartMessage] = useState('');
  const [cartError, setCartError] = useState('');

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

  // Review submission state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');

  const loadReviewsData = () => {
    setIsLoadingReviews(true);
    getProductReviews(productId)
      .then((data) => {
        setReviews(data.reviews || []);
        setTotalReviews(data.totalReviews || 0);
        setAvgRating(data.averageRating || 0);
      })
      .catch(() => {})
      .finally(() => setIsLoadingReviews(false));
  };

  useEffect(() => {
    setIsLoading(true);
    setLoadError('');
    setQuantity(1);

    getProduct(productId)
      .then((data) => {
        const prod = data.product;
        setProduct(prod);
        setActiveImage(0);

        // Parse and initialize packaging options
        let pkgs = [];
        if (Array.isArray(prod.packaging_options)) {
          pkgs = prod.packaging_options;
        } else if (typeof prod.packaging_options === 'string') {
          try {
            pkgs = JSON.parse(prod.packaging_options);
          } catch (e) {
            pkgs = [];
          }
        }

        if (pkgs.length > 0) {
          setSelectedPackaging(pkgs[0]);
        } else {
          setSelectedPackaging({
            name: `Single ${prod.unit || 'Unit'}`,
            price: Number(prod.price),
          });
        }
      })
      .catch((err) => setLoadError(err.message || 'Could not load this product.'))
      .finally(() => setIsLoading(false));

    // Load recommendations
    getProductRecommendations(productId)
      .then((data) => setRecommendations(data.recommendations || []))
      .catch(() => {});

    loadReviewsData();
  }, [productId]);

  const activeUnitPrice = selectedPackaging ? Number(selectedPackaging.price) : Number(product?.price || 0);
  const activeTotalPrice = activeUnitPrice * quantity;

  const handlePackagingSelect = (pkg) => {
    setSelectedPackaging(pkg);
  };

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => Math.max(1, Math.min(prev + delta, product?.stock_quantity || 100)));
  };

  const handleAddToCart = async () => {
    setCartMessage('');
    setCartError('');
    setIsAdding(true);
    try {
      await addToCart(
        token,
        product.product_id,
        quantity,
        selectedPackaging?.name || 'Single Unit',
        activeUnitPrice
      );
      refreshCart();
      setCartMessage(`Added ${quantity}x ${selectedPackaging?.name || product.name} to your FreshBasket.`);
    } catch (err) {
      setCartError(err.message || 'Could not add this to your cart.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewSuccess('');
    setReviewError('');
    setIsSubmittingReview(true);

    try {
      await submitReview(token, {
        productId,
        rating: newRating,
        comment: newComment,
      });
      setReviewSuccess('Thank you! Your review has been published.');
      setNewComment('');
      loadReviewsData();
    } catch (err) {
      setReviewError(err.message || 'Could not submit your review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const productImgUrl = product ? getProductImageUrl(product) : '';
  const packagingList = Array.isArray(product?.packaging_options)
    ? product.packaging_options
    : typeof product?.packaging_options === 'string'
      ? (() => {
          try {
            return JSON.parse(product.packaging_options);
          } catch {
            return [];
          }
        })()
      : [];

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col justify-between">
      <div>
        <PublicHeader />

        <main className="mx-auto max-w-6xl px-6 py-10 sm:px-12">
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-emerald-800 mb-6 transition"
          >
            <ArrowLeft size={15} />
            Back to Marketplace
          </Link>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-24 text-gray-400">
              <Loader2 size={28} className="animate-spin text-emerald-700" />
              <p className="text-xs font-medium">Loading fresh produce details…</p>
            </div>
          ) : loadError || !product ? (
            <div role="alert" className="rounded-3xl bg-red-50 p-8 text-center text-sm text-red-700">
              {loadError || 'Product not found.'}
            </div>
          ) : (
            <>
              {/* Top Product Card */}
              <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-10 shadow-xs">
                <div className="grid gap-10 lg:grid-cols-2">
                  {/* Images Column */}
                  <div>
                    <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl bg-gray-100 border border-gray-100">
                      <img
                        src={product.images?.[activeImage]?.imageUrl || productImgUrl}
                        alt={product.name}
                        onError={(e) => handleImageFallback(e, product)}
                        className="h-full w-full object-cover transition duration-300"
                      />
                      {/* Location Badge */}
                      <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md px-3 py-1 text-xs font-bold text-emerald-900 shadow-sm">
                        <MapPin size={13} className="text-emerald-700" />
                        <span>{product.market_zone || 'Ogige Market'}</span>
                      </span>

                      {product.stock_quantity <= 0 && (
                        <span className="absolute bottom-3 right-3 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-xs">
                          Out of Stock
                        </span>
                      )}
                    </div>

                    {product.images?.length > 1 && (
                      <div className="mt-4 flex gap-2.5 overflow-x-auto pb-1">
                        {product.images.map((image, index) => (
                          <button
                            key={image.imageUrl || index}
                            type="button"
                            onClick={() => setActiveImage(index)}
                            className={`h-18 w-18 shrink-0 overflow-hidden rounded-2xl border-2 transition ${
                              index === activeImage
                                ? 'border-emerald-700 ring-2 ring-emerald-100'
                                : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={image.imageUrl}
                              alt=""
                              onError={(e) => handleImageFallback(e, product)}
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Details Column */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {product.category_name && (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                            {product.category_name}
                          </span>
                        )}

                        <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                          <Star size={14} className="fill-amber-400 text-amber-500" />
                          <span>{avgRating > 0 ? avgRating.toFixed(1) : 'New'}</span>
                          <span className="text-gray-400 font-normal">({totalReviews} reviews)</span>
                        </div>
                      </div>

                      <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                        {product.name}
                      </h1>

                      {/* Dynamic Price Display */}
                      <div className="mt-4 flex items-baseline gap-2">
                        <p className="text-3xl font-extrabold text-emerald-800">
                          {formatNaira(activeTotalPrice)}
                        </p>
                        {quantity > 1 && (
                          <span className="text-xs text-gray-400">
                            ({formatNaira(activeUnitPrice)} each)
                          </span>
                        )}
                      </div>

                      {/* Packaging Tier Selection (e.g. Indomie Single, Half Carton, Full Carton) */}
                      {packagingList.length > 0 && (
                        <div className="mt-6 rounded-2xl border border-gray-100 bg-emerald-50/30 p-4">
                          <label className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                            <Package size={14} className="text-emerald-700" />
                            Select Packaging Option:
                          </label>
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {packagingList.map((pkg) => {
                              const isSelected = selectedPackaging?.name === pkg.name;
                              return (
                                <button
                                  key={pkg.name}
                                  type="button"
                                  onClick={() => handlePackagingSelect(pkg)}
                                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition ${
                                    isSelected
                                      ? 'border-emerald-700 bg-white ring-2 ring-emerald-600/20 shadow-xs'
                                      : 'border-gray-200 bg-white/70 hover:border-emerald-300'
                                  }`}
                                >
                                  <span className="text-xs font-bold text-gray-900">{pkg.name}</span>
                                  <span className="mt-1 text-xs font-extrabold text-emerald-800">
                                    ₦{Number(pkg.price).toLocaleString()}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Quantity Selector Counter */}
                      <div className="mt-6 flex items-center gap-4">
                        <span className="text-xs font-bold text-gray-700">Quantity:</span>
                        <div className="flex items-center rounded-full border border-gray-200 bg-gray-50 p-1">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(-1)}
                            disabled={quantity <= 1}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow-2xs hover:bg-gray-100 disabled:opacity-40 transition"
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={product.stock_quantity || 100}
                            value={quantity}
                            onChange={(e) =>
                              setQuantity(Math.max(1, Number(e.target.value) || 1))
                            }
                            className="w-12 text-center text-xs font-bold text-gray-900 bg-transparent focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(1)}
                            disabled={quantity >= product.stock_quantity}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow-2xs hover:bg-gray-100 disabled:opacity-40 transition"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <span className="text-xs text-gray-400">
                          {product.stock_quantity > 0 ? (
                            <span className="text-emerald-700 font-medium">
                              In Stock ({product.stock_quantity} available)
                            </span>
                          ) : (
                            <span className="text-red-500 font-medium">Sold Out</span>
                          )}
                        </span>
                      </div>

                      {/* Vendor's Product Description */}
                      <div className="mt-6">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                          Vendor&rsquo;s Description
                        </h3>
                        <p className="mt-1.5 text-xs sm:text-sm text-gray-600 leading-relaxed">
                          {product.description ||
                            'Fresh quality produce sourced and verified from local agricultural markets in Nsukka.'}
                        </p>
                      </div>

                      {/* Vendor Stall Info Box */}
                      <Link
                        to={`/shop/vendor/${product.vendor_id}`}
                        className="group mt-6 flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/80 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/30"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-800 shadow-2xs group-hover:bg-emerald-800 group-hover:text-white transition">
                            <Store size={18} />
                          </span>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-emerald-800">
                              {product.shop_name}
                            </p>
                            <p className="flex items-center gap-1 text-[11px] text-gray-500">
                              <MapPin size={11} className="text-emerald-700" />
                              {product.business_address || product.market_zone}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-emerald-700 group-hover:underline">
                          View Stall Catalogue →
                        </span>
                      </Link>
                    </div>

                    {/* Add to Cart Actions */}
                    <div className="mt-8 border-t border-gray-100 pt-5">
                      {cartMessage && (
                        <p
                          role="status"
                          className="mb-3 rounded-2xl bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 flex items-center gap-2"
                        >
                          <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                          <span>{cartMessage}</span>
                        </p>
                      )}
                      {cartError && (
                        <p
                          role="alert"
                          className="mb-3 rounded-2xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700 flex items-center gap-2"
                        >
                          <AlertCircle size={16} className="text-red-600 shrink-0" />
                          <span>{cartError}</span>
                        </p>
                      )}

                      {isCustomer ? (
                        <button
                          type="button"
                          onClick={handleAddToCart}
                          disabled={isAdding || product.stock_quantity <= 0}
                          className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-800 py-3.5 text-sm font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <ShoppingCart size={17} />
                          {isAdding
                            ? 'Adding to FreshBasket…'
                            : product.stock_quantity <= 0
                              ? 'Out of Stock'
                              : `Add to Cart • ${formatNaira(activeTotalPrice)}`}
                        </button>
                      ) : (
                        <div className="rounded-2xl bg-gray-50 p-4 text-center text-xs text-gray-600">
                          {isAuthenticated ? (
                            'Only customer accounts can add items to cart.'
                          ) : (
                            <>
                              <Link to="/sign-in" className="font-bold text-emerald-800 underline">
                                Sign in
                              </Link>{' '}
                              as a customer to add this item to your cart.
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Recommendations Section (User Request) */}
              {recommendations.length > 0 && (
                <div className="mt-12">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                        Related Fresh Produce
                      </span>
                      <h2 className="text-xl font-bold text-gray-900">Recommended Around This Stall</h2>
                    </div>
                    <Link
                      to="/shop"
                      className="text-xs font-bold text-emerald-800 hover:underline"
                    >
                      Browse More →
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {recommendations.map((rec) => {
                      const recImg = getProductImageUrl(rec);
                      return (
                        <div
                          key={rec.product_id}
                          className="group flex flex-col justify-between rounded-3xl border border-gray-200 bg-white p-3.5 transition hover:border-emerald-300 hover:shadow-xs"
                        >
                          <Link to={`/shop/${rec.product_id}`}>
                            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100">
                              <img
                                src={recImg}
                                alt={rec.name}
                                onError={(e) => handleImageFallback(e, rec)}
                                className="h-full w-full object-cover transition group-hover:scale-105"
                              />
                              <span className="absolute top-2 left-2 rounded-full bg-white/90 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold text-emerald-900 flex items-center gap-0.5">
                                <MapPin size={9} className="text-emerald-700" />
                                {rec.market_zone || 'Ogige'}
                              </span>
                            </div>
                          </Link>

                          <div className="mt-3 flex flex-1 flex-col justify-between">
                            <div>
                              <span className="text-[10px] font-semibold text-gray-400 uppercase">
                                {rec.category_name}
                              </span>
                              <Link
                                to={`/shop/${rec.product_id}`}
                                className="mt-0.5 line-clamp-1 text-xs font-bold text-gray-900 group-hover:text-emerald-800"
                              >
                                {rec.name}
                              </Link>
                              <p className="text-[10px] text-gray-500">{rec.shop_name}</p>
                            </div>

                            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2">
                              <span className="text-xs font-extrabold text-gray-900">
                                ₦{Number(rec.price).toLocaleString()}
                              </span>
                              <Link
                                to={`/shop/${rec.product_id}`}
                                className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800 hover:bg-emerald-800 hover:text-white transition"
                              >
                                View
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ratings & Customer Reviews Section (FR10 / UC07) */}
              <div className="mt-12 rounded-3xl border border-gray-200 bg-white p-6 sm:p-10 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Customer Ratings & Reviews</h2>
                    <p className="text-xs text-gray-500">Verified shopper feedback for this item.</p>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-amber-50/80 px-4 py-2">
                    <Star size={20} className="fill-amber-400 text-amber-500" />
                    <div>
                      <span className="text-lg font-extrabold text-amber-900">
                        {avgRating > 0 ? avgRating.toFixed(1) : '5.0'}
                      </span>
                      <span className="text-xs text-amber-700 ml-1">/ 5.0 ({totalReviews} reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Review Submission Form */}
                {isCustomer ? (
                  <form onSubmit={handleReviewSubmit} className="mt-6 rounded-2xl bg-gray-50/70 p-5 border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Leave a Review</h3>

                    {reviewSuccess && (
                      <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-medium text-emerald-800">
                        <CheckCircle2 size={15} className="shrink-0 text-emerald-700" />
                        {reviewSuccess}
                      </div>
                    )}

                    {reviewError && (
                      <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2 text-xs font-medium text-red-700">
                        <AlertCircle size={15} className="shrink-0 text-red-600" />
                        {reviewError}
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-1.5">
                      <span className="text-xs font-medium text-gray-500 mr-2">Your Rating:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="p-1 transition hover:scale-110"
                        >
                          <Star
                            size={18}
                            className={
                              star <= newRating ? 'fill-amber-400 text-amber-500' : 'text-gray-300'
                            }
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-gray-700 ml-1">{newRating} Stars</span>
                    </div>

                    <div className="mt-3">
                      <textarea
                        rows={3}
                        placeholder="Share your experience (freshness, quick packaging, quality)…"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full rounded-2xl border border-gray-200 bg-white p-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-emerald-700 focus:outline-none"
                      />
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="flex items-center gap-1.5 rounded-full bg-emerald-800 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-60"
                      >
                        {isSubmittingReview ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                        Submit Review
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-center text-xs text-gray-500">
                    {isAuthenticated ? (
                      'Customer accounts can leave feedback for purchased items.'
                    ) : (
                      <>
                        <Link to="/sign-in" className="font-semibold text-emerald-800 underline">
                          Sign in
                        </Link>{' '}
                        to leave a rating and review for this product.
                      </>
                    )}
                  </div>
                )}

                {/* Reviews List */}
                <div className="mt-8">
                  {isLoadingReviews ? (
                    <div className="flex items-center gap-2 py-8 text-gray-400 text-xs">
                      <Loader2 size={16} className="animate-spin" />
                      Loading reviews…
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-gray-400">
                      <MessageSquare size={24} className="text-gray-300" />
                      <p className="text-xs">No reviews for this product yet. Be the first to share your thoughts!</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {reviews.map((rev) => (
                        <li key={rev.review_id} className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                                {rev.customer_name?.charAt(0) || 'C'}
                              </span>
                              <span className="text-xs font-bold text-gray-900">{rev.customer_name}</span>
                            </div>
                            <span className="text-[11px] text-gray-400">{formatDate(rev.created_at)}</span>
                          </div>

                          <div className="mt-1.5 flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={12}
                                className={s <= rev.rating ? 'fill-amber-400 text-amber-500' : 'text-gray-200'}
                              />
                            ))}
                          </div>

                          {rev.comment && (
                            <p className="mt-2 text-xs text-gray-600 leading-relaxed">{rev.comment}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}

export default ProductDetailPage;
