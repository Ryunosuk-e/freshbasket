import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, MapPin, Package, ShoppingCart, Store } from 'lucide-react';
import PublicHeader from '../components/PublicHeader.jsx';
import { getProduct } from '../api/products.js';
import { addToCart } from '../api/cart.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

function formatNaira(price) {
  const amount = Number(price);
  return `\u20a6${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
  const [isAdding, setIsAdding] = useState(false);
  const [cartMessage, setCartMessage] = useState('');
  const [cartError, setCartError] = useState('');

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

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <main className="mx-auto max-w-4xl px-6 py-10 sm:px-12">
        <Link to="/shop" className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700">
          <ArrowLeft size={16} />
          Back to Shop
        </Link>

        {isLoading ? (
          <div className="flex items-center gap-2 py-16 text-gray-400">
            <Loader2 size={18} className="animate-spin" />
            Loading…
          </div>
        ) : loadError || !product ? (
          <div role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError || 'Product not found.'}
          </div>
        ) : (
          <div className="mt-6 grid gap-8 sm:grid-cols-2">
            <div>
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-3xl bg-gray-50">
                {product.images?.length > 0 ? (
                  <img src={product.images[activeImage].imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Package className="text-gray-300" size={48} />
                )}
              </div>
              {product.images?.length > 1 && (
                <div className="mt-3 flex gap-2">
                  {product.images.map((image, index) => (
                    <button
                      key={image.imageUrl}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      className={`h-16 w-16 overflow-hidden rounded-xl border-2 ${
                        index === activeImage ? 'border-emerald-700' : 'border-transparent'
                      }`}
                    >
                      <img src={image.imageUrl} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              {product.category_name && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  {product.category_name}
                </span>
              )}
              <h1 className="mt-3 text-2xl font-semibold text-gray-900">{product.name}</h1>
              <p className="mt-2 text-2xl font-semibold text-emerald-800">
                {formatNaira(product.price)} <span className="text-base font-normal text-gray-400">/ {product.unit}</span>
              </p>

              {product.description && <p className="mt-4 text-gray-600">{product.description}</p>}

              <p className="mt-4 text-sm text-gray-500">
                {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Currently out of stock'}
              </p>

              <div className="mt-6 rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Store size={16} className="text-emerald-700" />
                  {product.shop_name}
                </div>
                {product.business_address && (
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                    <MapPin size={14} />
                    {product.business_address}
                  </div>
                )}
              </div>

              {cartMessage && (
                <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
                  {cartMessage}
                </p>
              )}
              {cartError && (
                <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
                  {cartError}
                </p>
              )}

              {isCustomer ? (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAdding || product.stock_quantity <= 0}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-800 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ShoppingCart size={16} />
                  {isAdding ? 'Adding…' : product.stock_quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              ) : (
                <div className="mt-6 rounded-xl bg-gray-50 px-4 py-3 text-center text-sm text-gray-600">
                  {isAuthenticated ? (
                    'Only customer accounts can add items to a cart.'
                  ) : (
                    <>
                      <Link to="/sign-in" className="font-medium text-emerald-700 underline">
                        Sign in
                      </Link>{' '}
                      as a customer to add this to your cart.
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ProductDetailPage;
