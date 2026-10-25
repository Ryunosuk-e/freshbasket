import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Minus, Package, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { getCart, removeCartItem, updateCartItem } from '../api/cart.js';
import { getProductImageUrl, handleImageFallback } from '../utils/productImages.js';

function formatNaira(price) {
  const amount = Number(price);
  return `\u20a6${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function CartPage() {
  const { token } = useAuth();
  const { refreshCart } = useCart();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

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

  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  return (
    <div className="min-h-screen bg-white">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-6 py-12 sm:px-12">
        <h1 className="text-2xl font-semibold text-gray-900">Your Cart</h1>

        {isLoading ? (
          <div className="flex items-center gap-2 py-16 text-gray-400">
            <Loader2 size={18} className="animate-spin" />
            Loading your cart…
          </div>
        ) : loadError ? (
          <div role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-2 rounded-3xl bg-emerald-50 py-16 text-center">
            <ShoppingCart className="text-emerald-700" size={28} />
            <p className="font-medium text-gray-900">Your cart is empty</p>
            <Link to="/shop" className="mt-2 text-sm font-medium text-emerald-700 underline">
              Browse groceries
            </Link>
          </div>
        ) : (
          <>
            <ul className="mt-6 divide-y divide-gray-100">
              {items.map((item) => {
                const isUnavailable = !item.is_active || item.verification_status !== 'verified';
                const imgSrc = getProductImageUrl(item);
                return (
                  <li key={item.cart_item_id} className="flex items-center gap-4 py-4">
                    <img
                      src={imgSrc}
                      alt={item.name}
                      onError={(e) => handleImageFallback(e, item)}
                      className="h-16 w-16 rounded-2xl object-cover bg-gray-50 border border-gray-100 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{item.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{item.shop_name}</span>
                        {item.packaging_unit && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            {item.packaging_unit}
                          </span>
                        )}
                      </div>
                      {isUnavailable && (
                        <p className="mt-0.5 text-xs font-medium text-red-600">No longer available — remove it to continue</p>
                      )}
                      <p className="mt-1 text-sm font-extrabold text-emerald-800">
                        {formatNaira(item.price)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => changeQuantity(item.product_id, item.quantity - 1)}
                        disabled={updatingId === item.product_id}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => changeQuantity(item.product_id, item.quantity + 1)}
                        disabled={updatingId === item.product_id || item.quantity >= item.stock_quantity}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => changeQuantity(item.product_id, 0)}
                      disabled={updatingId === item.product_id}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition"
                      aria-label="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-6">
              <span className="text-gray-500 font-medium">Subtotal</span>
              <span className="text-xl font-extrabold text-gray-900">{formatNaira(subtotal)}</span>
            </div>

            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="mt-4 w-full rounded-full bg-emerald-800 py-3.5 text-sm font-bold text-white shadow-xs transition hover:bg-emerald-700"
            >
              Proceed to Checkout
            </button>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default CartPage;
