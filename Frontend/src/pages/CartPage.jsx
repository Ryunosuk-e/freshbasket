import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loader2,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Trash2,
  Heart,
  Eye,
  ArrowRight,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { getCart, removeCartItem, updateCartItem, addToCart as apiAddToCart } from '../api/cart.js';
import { getProductImageUrl, handleImageFallback } from '../utils/productImages.js';
import { getRecentlyViewed } from '../utils/recentlyViewed.js';

function formatNaira(price) {
  const amount = Number(price);
  return `\u20a6${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function CartPage() {
  const { token, isAuthenticated } = useAuth();
  const { refreshCart } = useCart();
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [addingRecentId, setAddingRecentId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const loadCart = () => {
    setIsLoading(true);
    setLoadError('');
    getCart(token)
      .then((data) => setItems(data.items || []))
      .catch((err) => setLoadError(err.message || 'Could not load your cart.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadCart();
    setRecentlyViewed(getRecentlyViewed());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeQuantity = async (productId, nextQuantity) => {
    setUpdatingId(productId);
    try {
      const data =
        nextQuantity <= 0 ? await removeCartItem(token, productId) : await updateCartItem(token, productId, nextQuantity);
      setItems(data.items || []);
      refreshCart();
    } catch (err) {
      setLoadError(err.message || 'Could not update your cart.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMoveWishlistToCart = async (product) => {
    setUpdatingId(product.product_id);
    try {
      await apiAddToCart(token, product.product_id, 1);
      refreshCart();
      removeFromWishlist(product.product_id);
      loadCart();
      setToastMessage(`"${product.name}" added to cart!`);
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      setLoadError(err.message || 'Could not add item to cart.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddRecentToCart = async (product) => {
    setAddingRecentId(product.product_id);
    try {
      await apiAddToCart(token, product.product_id, 1);
      refreshCart();
      loadCart();
      setToastMessage(`"${product.name}" added to cart!`);
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      setLoadError(err.message || 'Could not add item to cart.');
    } finally {
      setAddingRecentId(null);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        <AppHeader />

        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
          {/* Main Cart Section */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                  <ShoppingCart size={20} />
                </span>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Shopping Cart</h1>
                  <p className="text-xs text-gray-500">
                    {items.length} {items.length === 1 ? 'grocery item' : 'grocery items'} selected
                  </p>
                </div>
              </div>

              {items.length > 0 && (
                <Link to="/shop" className="text-xs font-semibold text-emerald-800 hover:underline flex items-center gap-1">
                  Continue Shopping <ArrowRight size={13} />
                </Link>
              )}
            </div>

            {toastMessage && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs font-semibold text-emerald-800">
                <CheckCircle2 size={15} />
                <span>{toastMessage}</span>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-xs text-gray-400">
                <Loader2 size={18} className="animate-spin" />
                Loading your cart…
              </div>
            ) : loadError ? (
              <div role="alert" className="mt-6 rounded-2xl bg-red-50 p-4 text-xs font-semibold text-red-700">
                {loadError}
              </div>
            ) : items.length === 0 ? (
              <div className="mt-6 flex flex-col items-center gap-2 rounded-3xl bg-emerald-50/50 border border-emerald-100 py-12 text-center">
                <ShoppingCart className="text-emerald-700" size={32} />
                <p className="font-bold text-gray-900">Your cart is currently empty</p>
                <p className="text-xs text-gray-500 max-w-xs">
                  Discover fresh fruits, rice, catfish, spices and provisions from Nsukka markets.
                </p>
                <Link
                  to="/shop"
                  className="mt-4 rounded-full bg-emerald-800 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <>
                <ul className="mt-6 divide-y divide-gray-100">
                  {items.map((item) => {
                    const isUnavailable = !item.is_active || item.verification_status !== 'verified';
                    const imgSrc = getProductImageUrl(item);
                    return (
                      <li key={item.cart_item_id} className="flex flex-col sm:flex-row sm:items-center gap-4 py-4">
                        <img
                          src={imgSrc}
                          alt={item.name}
                          onError={(e) => handleImageFallback(e, item)}
                          className="h-18 w-18 sm:h-20 sm:w-20 rounded-2xl object-cover bg-gray-50 border border-gray-100 shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/shop/${item.product_id}`}
                            className="font-bold text-sm text-gray-900 hover:text-emerald-800 truncate block"
                          >
                            {item.name}
                          </Link>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            <span>{item.shop_name}</span>
                            {item.packaging_unit && (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                {item.packaging_unit}
                              </span>
                            )}
                          </div>
                          {isUnavailable && (
                            <p className="mt-0.5 text-xs font-medium text-red-600">
                              Item no longer available — please remove to proceed
                            </p>
                          )}
                          <p className="mt-1 text-sm font-extrabold text-emerald-900">
                            {formatNaira(item.price)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 mt-2 sm:mt-0">
                          <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50/50 p-1">
                            <button
                              type="button"
                              onClick={() => changeQuantity(item.product_id, item.quantity - 1)}
                              disabled={updatingId === item.product_id}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-600 shadow-xs hover:bg-gray-100 disabled:opacity-50"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-7 text-center text-xs font-bold text-gray-900">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => changeQuantity(item.product_id, item.quantity + 1)}
                              disabled={updatingId === item.product_id || item.quantity >= item.stock_quantity}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-600 shadow-xs hover:bg-gray-100 disabled:opacity-50"
                            >
                              <Plus size={13} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => changeQuantity(item.product_id, 0)}
                            disabled={updatingId === item.product_id}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition"
                            aria-label="Remove item"
                            title="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Subtotal & Checkout Button */}
                <div className="mt-6 border-t border-gray-100 pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm font-medium">Order Subtotal</span>
                    <span className="text-2xl font-black text-gray-900">{formatNaira(subtotal)}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">
                    Delivery fee and hostel rider dispatch computed at checkout.
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate('/checkout')}
                    className="mt-5 w-full flex items-center justify-center gap-2 rounded-full bg-emerald-800 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-700"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Section 1: Wishlist Items (Shown below cart entries) */}
          <section className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                  <Heart size={18} className="fill-rose-600 text-rose-600" />
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">Your Saved Wishlist</h2>
                  <p className="text-xs text-gray-500">Items saved for later from Nsukka traders</p>
                </div>
              </div>

              {wishlistItems.length > 0 && (
                <Link to="/wishlist" className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1">
                  View All ({wishlistItems.length}) <ArrowRight size={13} />
                </Link>
              )}
            </div>

            {wishlistItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                You have no items in your wishlist yet.{' '}
                <Link to="/shop" className="text-emerald-700 underline font-semibold">
                  Browse products
                </Link>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {wishlistItems.slice(0, 4).map((p) => {
                  const img = getProductImageUrl(p);
                  return (
                    <div
                      key={p.product_id}
                      className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 transition hover:border-emerald-300"
                    >
                      <div>
                        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-100">
                          <Link to={`/shop/${p.product_id}`}>
                            <img
                              src={img}
                              alt={p.name}
                              onError={(e) => handleImageFallback(e, p)}
                              className="h-full w-full object-cover transition group-hover:scale-105"
                            />
                          </Link>
                        </div>
                        <Link
                          to={`/shop/${p.product_id}`}
                          className="mt-2 block font-bold text-xs text-gray-900 line-clamp-1 group-hover:text-emerald-800"
                        >
                          {p.name}
                        </Link>
                        <p className="text-[10px] text-gray-400 truncate">{p.shop_name}</p>
                      </div>

                      <div className="mt-2 border-t border-gray-100 pt-2 flex items-center justify-between">
                        <span className="text-xs font-black text-gray-900">
                          ₦{Number(p.price).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleMoveWishlistToCart(p)}
                          disabled={updatingId === p.product_id}
                          className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-800 hover:text-white transition disabled:opacity-50"
                        >
                          + Cart
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section 2: Recently Viewed Items (Shown below wishlist) */}
          <section className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                  <Eye size={18} />
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">Recently Viewed</h2>
                  <p className="text-xs text-gray-500">Products you inspected during your session</p>
                </div>
              </div>
            </div>

            {recentlyViewed.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No recently viewed products yet.
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {recentlyViewed.slice(0, 4).map((p) => {
                  const img = getProductImageUrl(p);
                  return (
                    <div
                      key={p.product_id}
                      className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 transition hover:border-emerald-300"
                    >
                      <div>
                        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-100">
                          <Link to={`/shop/${p.product_id}`}>
                            <img
                              src={img}
                              alt={p.name}
                              onError={(e) => handleImageFallback(e, p)}
                              className="h-full w-full object-cover transition group-hover:scale-105"
                            />
                          </Link>
                          {p.market_zone && (
                            <span className="absolute bottom-1.5 left-1.5 rounded-full bg-white/90 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-bold text-emerald-950 shadow-xs flex items-center gap-0.5">
                              <MapPin size={8} className="text-emerald-700" />
                              <span className="truncate max-w-[80px]">{p.market_zone}</span>
                            </span>
                          )}
                        </div>
                        <Link
                          to={`/shop/${p.product_id}`}
                          className="mt-2 block font-bold text-xs text-gray-900 line-clamp-1 group-hover:text-emerald-800"
                        >
                          {p.name}
                        </Link>
                        <p className="text-[10px] text-gray-400 truncate">{p.shop_name}</p>
                      </div>

                      <div className="mt-2 border-t border-gray-100 pt-2 flex items-center justify-between">
                        <span className="text-xs font-black text-gray-900">
                          ₦{Number(p.price).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddRecentToCart(p)}
                          disabled={addingRecentId === p.product_id}
                          className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-800 hover:text-white transition disabled:opacity-50"
                        >
                          + Cart
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
}

export default CartPage;
