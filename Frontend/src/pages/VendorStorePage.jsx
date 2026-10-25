import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MapPin,
  Package,
  Phone,
  Search,
  ShoppingBag,
  Star,
  Store,
} from 'lucide-react';
import PublicHeader from '../components/PublicHeader.jsx';
import Footer from '../components/Footer.jsx';
import { browseProducts, getVendorPublicProfile } from '../api/products.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getProductImageUrl, handleImageFallback } from '../utils/productImages.js';

function formatNaira(price) {
  const amount = Number(price);
  return `\u20a6${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function VendorStorePage() {
  const { vendorId } = useParams();
  const { token } = useAuth();

  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setIsLoading(true);
    setLoadError('');

    Promise.all([
      getVendorPublicProfile(vendorId, token).catch(() => null),
      browseProducts({ vendor: vendorId, q: searchQuery }),
    ])
      .then(([vendorRes, productsRes]) => {
        if (vendorRes?.vendor) {
          setVendor(vendorRes.vendor);
        }
        setProducts(productsRes.products || []);
        setTotal(productsRes.total || 0);
      })
      .catch((err) => setLoadError(err.message || 'Could not load vendor store.'))
      .finally(() => setIsLoading(false));
  }, [vendorId, token, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <PublicHeader />

      <main className="mx-auto max-w-6xl px-6 py-10 sm:px-12">
        <Link to="/shop" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft size={16} />
          Back to All Groceries
        </Link>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-gray-400">
            <Loader2 size={24} className="animate-spin text-emerald-700" />
            <p className="text-sm">Loading storefront…</p>
          </div>
        ) : loadError ? (
          <div role="alert" className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-700">
            {loadError}
          </div>
        ) : (
          <>
            {/* Vendor Hero Banner */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-800 text-white shadow-sm">
                    <Store size={32} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-bold text-gray-900">{vendor?.shop_name || 'Vendor Storefront'}</h1>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        <CheckCircle2 size={13} className="text-emerald-700" />
                        Verified Merchant
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-600">
                      {vendor?.business_address && (
                        <span className="flex items-center gap-1">
                          <MapPin size={13} className="text-emerald-700" />
                          {vendor.business_address}
                        </span>
                      )}
                      {vendor?.category && (
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 font-medium text-gray-700">
                          {vendor.category}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-amber-600 font-semibold">
                        <Star size={13} className="fill-amber-400 text-amber-500" />
                        {Number(vendor?.average_rating || 5.0).toFixed(1)} Rating
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-emerald-50/70 p-4 text-center sm:text-right">
                  <p className="text-xs text-gray-500 font-medium">Available Inventory</p>
                  <p className="text-2xl font-extrabold text-emerald-900">{total} Products</p>
                </div>
              </div>
            </div>

            {/* Products Search & List */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Products in this Shop</h2>
                <p className="text-xs text-gray-500">Fresh stock directly from this stall.</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search in this shop…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs text-gray-900 focus:border-emerald-700 focus:outline-hidden"
                />
              </div>
            </div>

            {products.length === 0 ? (
              <div className="mt-6 flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center">
                <Package size={28} className="text-gray-400" />
                <p className="text-sm font-semibold text-gray-900">No products found</p>
                <p className="text-xs text-gray-500">This vendor has no active listings matching your query.</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => {
                  const imgSrc = getProductImageUrl(product);

                  return (
                    <Link
                      key={product.product_id}
                      to={`/shop/${product.product_id}`}
                      className="group flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-md"
                    >
                      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100">
                        <img
                          src={imgSrc}
                          alt={product.name}
                          onError={(e) => handleImageFallback(e, product)}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                        {product.stock_quantity <= 0 && (
                          <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                            Out of Stock
                          </span>
                        )}
                        <span className="absolute top-2 right-2 rounded-full bg-white/90 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold text-emerald-900 shadow-xs flex items-center gap-0.5">
                          <MapPin size={9} className="text-emerald-700" />
                          {vendor?.market_zone || 'Ogige'}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-1 flex-col justify-between">
                        <div>
                          <p className="text-xs text-emerald-800 font-semibold">{product.category_name}</p>
                          <h3 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-emerald-800">
                            {product.name}
                          </h3>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-sm font-extrabold text-emerald-900">
                            {formatNaira(product.price)}
                            <span className="text-[11px] font-normal text-gray-400">/{product.unit}</span>
                          </p>
                          {product.average_rating > 0 && (
                            <span className="flex items-center gap-0.5 text-xs text-amber-600 font-semibold">
                              <Star size={11} className="fill-amber-400 text-amber-500" />
                              {product.average_rating}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default VendorStorePage;
