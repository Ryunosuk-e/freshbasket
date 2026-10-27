import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowRight, MapPin, CheckCircle2, ShoppingBag } from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import Footer from '../components/Footer.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { addToCart as apiAddToCart } from '../api/cart.js';
import { getProductImageUrl, handleImageFallback } from '../utils/productImages.js';

function formatNaira(price) {
  const amount = Number(price);
  return `\u20a6${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function WishlistPage() {
  const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlist();
  const { refreshCart } = useCart();
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [movingId, setMovingId] = useState(null);
  const [successToast, setSuccessToast] = useState('');

  const handleMoveToCart = async (product) => {
    if (!isAuthenticated) {
      navigate('/sign-in', { state: { message: 'Please sign in to add items to your cart.' } });
      return;
    }
    setMovingId(product.product_id);
    try {
      await apiAddToCart(token, product.product_id, 1);
      refreshCart();
      removeFromWishlist(product.product_id);
      setSuccessToast(`"${product.name}" moved to your cart!`);
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setMovingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        <AppHeader />

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 shadow-xs">
                  <Heart size={20} className="fill-rose-600 text-rose-600" />
                </span>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Wishlist</h1>
                  <p className="text-xs text-gray-500">Items you saved for later from Nsukka markets</p>
                </div>
              </div>
            </div>

            {wishlistItems.length > 0 && (
              <button
                type="button"
                onClick={clearWishlist}
                className="text-xs font-semibold text-gray-500 hover:text-red-600 transition"
              >
                Clear all wishlist items
              </button>
            )}
          </div>

          {successToast && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-semibold text-emerald-800 animate-in fade-in">
              <CheckCircle2 size={16} />
              <span>{successToast}</span>
            </div>
          )}

          {wishlistItems.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-xs">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-500">
                <Heart size={32} />
              </div>
              <h2 className="mt-4 text-base font-bold text-gray-900">Your wishlist is empty</h2>
              <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                Explore local fresh produce, grains, spices, and utensils across Ogige Market and save your favorites here.
              </p>
              <Link
                to="/shop"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-800 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
              >
                <ShoppingBag size={14} />
                <span>Browse Marketplace</span>
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {wishlistItems.map((item) => {
                const imgSrc = getProductImageUrl(item);
                return (
                  <div
                    key={item.product_id}
                    className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-gray-200 bg-white p-3.5 transition hover:border-emerald-300 hover:shadow-md"
                  >
                    <div>
                      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100">
                        <Link to={`/shop/${item.product_id}`}>
                          <img
                            src={imgSrc}
                            alt={item.name}
                            onError={(e) => handleImageFallback(e, item)}
                            className="h-full w-full object-cover transition group-hover:scale-105"
                          />
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeFromWishlist(item.product_id)}
                          title="Remove from wishlist"
                          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-rose-600 hover:bg-white shadow-xs transition"
                        >
                          <Trash2 size={13} />
                        </button>
                        {item.market_zone && (
                          <span className="absolute bottom-2 left-2 rounded-full bg-white/90 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold text-emerald-950 shadow-xs flex items-center gap-1">
                            <MapPin size={9} className="text-emerald-700" />
                            {item.market_zone}
                          </span>
                        )}
                      </div>

                      <div className="mt-3">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block truncate">
                          {item.category_name || 'Produce'}
                        </span>
                        <Link
                          to={`/shop/${item.product_id}`}
                          className="mt-0.5 line-clamp-2 text-xs sm:text-sm font-bold text-gray-900 group-hover:text-emerald-800"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-0.5 text-[11px] text-gray-500 truncate">{item.shop_name}</p>
                      </div>
                    </div>

                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <div className="mb-2.5">
                        <span className="text-sm font-black text-gray-900">{formatNaira(item.price)}</span>
                        {item.unit && <span className="ml-1 text-[10px] text-gray-400">/{item.unit}</span>}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleMoveToCart(item)}
                        disabled={movingId === item.product_id}
                        className="w-full flex items-center justify-center gap-1.5 rounded-full bg-emerald-800 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        <ShoppingCart size={13} />
                        <span>{movingId === item.product_id ? 'Moving…' : 'Move to Cart'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
