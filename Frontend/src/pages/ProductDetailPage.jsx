import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MapPin,
  MessageSquare,
  Package,
  Send,
  ShoppingCart,
  Star,
  Store,
  User,
} from 'lucide-react';
import PublicHeader from '../components/PublicHeader.jsx';
import { getProduct } from '../api/products.js';
import { addToCart } from '../api/cart.js';
import { getProductReviews, submitReview } from '../api/reviews.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

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
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeImage, setActiveImage] = useState(0);

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
    getProduct(productId)
      .then((data) => {
        setProduct(data.product);
        setActiveImage(0);
      })
      .catch((err) => setLoadError(err.message || 'Could not load this product.'))
      .finally(() => setIsLoading(false));

    loadReviewsData();
  }, [productId]);

  const handleAddToCart = async () => {
    setCartMessage('');
    setCartError('');
    setIsAdding(true);
    try {
      await addToCart(token, product.product_id, 1);
      refreshCart();
      setCartMessage('Added to your cart.');
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

  return (
    <div className="min-h-screen bg-gray-50/50">
      <PublicHeader />

      <main className="mx-auto max-w-5xl px-6 py-10 sm:px-12">
        <Link to="/shop" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft size={16} />
          Back to Shop
        </Link>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-gray-400">
            <Loader2 size={24} className="animate-spin text-emerald-700" />
            <p className="text-sm">Loading product details…</p>
          </div>
        ) : loadError || !product ? (
          <div role="alert" className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-700">
            {loadError || 'Product not found.'}
          </div>
        ) : (
          <>
            {/* Top Product Card */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
              <div className="grid gap-8 sm:grid-cols-2">
                {/* Images */}
                <div>
                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-3xl bg-gray-50 border border-gray-100">
                    {product.images?.length > 0 ? (
                      <img src={product.images[activeImage].imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Package className="text-gray-300" size={54} />
                    )}
                  </div>
                  {product.images?.length > 1 && (
                    <div className="mt-3 flex gap-2">
                      {product.images.map((image, index) => (
                        <button
                          key={image.imageUrl}
                          type="button"
                          onClick={() => setActiveImage(index)}
                          className={`h-16 w-16 overflow-hidden rounded-xl border-2 transition ${
                            index === activeImage ? 'border-emerald-700 shadow-xs' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={image.imageUrl} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {product.category_name && (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                          {product.category_name}
                        </span>
                      )}

                      <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                        <Star size={14} className="fill-amber-400 text-amber-500" />
                        <span>{avgRating > 0 ? avgRating.toFixed(1) : 'New'}</span>
                        <span className="text-gray-400 font-normal">({totalReviews} reviews)</span>
                      </div>
                    </div>

                    <h1 className="mt-3 text-2xl font-bold text-gray-900">{product.name}</h1>
                    <p className="mt-2 text-2xl font-extrabold text-emerald-800">
                      {formatNaira(product.price)}{' '}
                      <span className="text-sm font-normal text-gray-400">/ {product.unit}</span>
                    </p>

                    {product.description && (
                      <p className="mt-4 text-sm text-gray-600 leading-relaxed">{product.description}</p>
                    )}

                    <p className="mt-4 text-xs font-semibold text-gray-500">
                      Availability:{' '}
                      {product.stock_quantity > 0 ? (
                        <span className="text-emerald-700">{product.stock_quantity} available in stall</span>
                      ) : (
                        <span className="text-red-600">Currently out of stock</span>
                      )}
                    </p>

                    {/* Vendor Shop Box (Clickable to Storefront) */}
                    <Link
                      to={`/shop/vendor/${product.vendor_id}`}
                      className="group mt-6 flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/80 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-800 shadow-2xs group-hover:bg-emerald-800 group-hover:text-white transition">
                          <Store size={18} />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-800">
                            {product.shop_name}
                          </p>
                          {product.business_address && (
                            <p className="flex items-center gap-1 text-xs text-gray-500">
                              <MapPin size={12} />
                              {product.business_address}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-emerald-700 group-hover:underline">
                        Visit Shop →
                      </span>
                    </Link>
                  </div>

                  {/* Add to Cart Actions */}
                  <div className="mt-6 border-t border-gray-100 pt-5">
                    {cartMessage && (
                      <p role="status" className="mb-3 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800">
                        {cartMessage}
                      </p>
                    )}
                    {cartError && (
                      <p role="alert" className="mb-3 rounded-xl bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">
                        {cartError}
                      </p>
                    )}

                    {isCustomer ? (
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={isAdding || product.stock_quantity <= 0}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-800 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <ShoppingCart size={16} />
                        {isAdding ? 'Adding…' : product.stock_quantity <= 0 ? 'Out of Stock' : 'Add to FreshBasket'}
                      </button>
                    ) : (
                      <div className="rounded-2xl bg-gray-50 p-4 text-center text-xs text-gray-600">
                        {isAuthenticated ? (
                          'Only customer accounts can add items to cart.'
                        ) : (
                          <>
                            <Link to="/sign-in" className="font-semibold text-emerald-800 underline">
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

            {/* Ratings & Customer Reviews Section (FR08 / UC07) */}
            <div className="mt-10 rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Customer Ratings & Reviews</h2>
                  <p className="text-xs text-gray-500">Verified shopper feedback for this item.</p>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-amber-50/80 px-4 py-2">
                  <Star size={20} className="fill-amber-400 text-amber-500" />
                  <div>
                    <span className="text-lg font-extrabold text-amber-900">{avgRating.toFixed(1)}</span>
                    <span className="text-xs text-amber-700 ml-1">/ 5.0 ({totalReviews} reviews)</span>
                  </div>
                </div>
              </div>

              {/* Review Submission Form */}
              {isCustomer ? (
                <form onSubmit={handleReviewSubmit} className="mt-6 rounded-2xl bg-gray-50/70 p-5 border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900">Write a Review</h3>

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

                  {/* Star Rating Buttons */}
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
                          size={20}
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
                      placeholder="Share your experience (e.g. freshness, quick packaging, quality)…"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 bg-white p-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-emerald-700 focus:outline-hidden"
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
  );
}

export default ProductDetailPage;
