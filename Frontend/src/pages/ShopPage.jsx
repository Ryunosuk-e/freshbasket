import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, Package, Search } from 'lucide-react';
import PublicHeader from '../components/PublicHeader.jsx';
import { browseProducts, getCategories } from '../api/products.js';

function formatNaira(price) {
  const amount = Number(price);
  return `\u20a6${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const q = searchParams.get('q') || '';

  const [searchInput, setSearchInput] = useState(q);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data.categories || []))
      .catch(() => {
        // Non-fatal — the category filter row just won't render.
      });
  }, []);

  useEffect(() => {
    setSearchInput(q);
    setPage(1);
    setIsLoading(true);
    setLoadError('');
    browseProducts({ q, category, page: 1 })
      .then((data) => {
        setProducts(data.products || []);
        setTotal(data.total || 0);
      })
      .catch((err) => setLoadError(err.message || 'Could not load products.'))
      .finally(() => setIsLoading(false));
  }, [q, category]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      next.set('q', searchInput.trim());
    } else {
      next.delete('q');
    }
    setSearchParams(next);
  };

  const handleCategoryClick = (slug) => {
    const next = new URLSearchParams(searchParams);
    if (slug === category) {
      next.delete('category');
    } else {
      next.set('category', slug);
    }
    setSearchParams(next);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setIsLoadingMore(true);
    browseProducts({ q, category, page: nextPage })
      .then((data) => {
        setProducts((prev) => [...prev, ...(data.products || [])]);
        setPage(nextPage);
      })
      .catch((err) => setLoadError(err.message || 'Could not load more products.'))
      .finally(() => setIsLoadingMore(false));
  };

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <main className="mx-auto max-w-6xl px-6 py-10 sm:px-12">
        <h1 className="text-2xl font-semibold text-gray-900">Shop</h1>
        <p className="mt-1 text-sm text-gray-500">Fresh groceries from verified Nsukka vendors.</p>

        <form onSubmit={handleSearchSubmit} className="mt-6 flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search for groceries…"
              className="w-full rounded-full border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-emerald-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Search
          </button>
        </form>

        {categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleCategoryClick('')}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                !category ? 'bg-emerald-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.category_id}
                type="button"
                onClick={() => handleCategoryClick(cat.slug)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  category === cat.slug ? 'bg-emerald-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        <div className="mt-8">
          {isLoading ? (
            <div className="flex items-center gap-2 py-16 text-gray-400">
              <Loader2 size={18} className="animate-spin" />
              Loading products…
            </div>
          ) : loadError ? (
            <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {loadError}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-3xl bg-emerald-50 py-16 text-center">
              <Package className="text-emerald-700" size={28} />
              <p className="font-medium text-gray-900">No products found</p>
              <p className="text-sm text-gray-500">
                {q || category
                  ? 'Try a different search or category.'
                  : 'Vendors are still stocking up — check back soon.'}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-400">{total} product{total === 1 ? '' : 's'}</p>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => {
                  const primaryImage = product.images?.find((image) => image.isPrimary) || product.images?.[0];
                  return (
                    <Link
                      key={product.product_id}
                      to={`/shop/${product.product_id}`}
                      className="group rounded-2xl border border-gray-100 p-3 transition hover:border-emerald-200"
                    >
                      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-gray-50">
                        {primaryImage ? (
                          <img
                            src={primaryImage.imageUrl}
                            alt=""
                            className="h-full w-full object-cover transition group-hover:scale-105"
                          />
                        ) : (
                          <Package className="text-gray-300" size={32} />
                        )}
                      </div>
                      <p className="mt-3 line-clamp-1 text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-400">{product.shop_name}</p>
                      <p className="mt-1 text-sm font-semibold text-emerald-800">
                        {formatNaira(product.price)} <span className="font-normal text-gray-400">/ {product.unit}</span>
                      </p>
                    </Link>
                  );
                })}
              </div>

              {products.length < total && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="rounded-full border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    {isLoadingMore ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default ShopPage;
