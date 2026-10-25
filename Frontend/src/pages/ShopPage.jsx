import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDownUp, Filter, Loader2, MapPin, Package, Search, Star, Store, X } from 'lucide-react';
import PublicHeader from '../components/PublicHeader.jsx';
import Footer from '../components/Footer.jsx';
import { browseProducts, getCategories } from '../api/products.js';
import { getProductImageUrl, handleImageFallback } from '../utils/productImages.js';

function formatNaira(price) {
  const amount = Number(price);
  return `\u20a6${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const locationParam = searchParams.get('location') || '';
  const q = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'newest';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';

  const [searchInput, setSearchInput] = useState(q);
  const [minPrice, setMinPrice] = useState(minPriceParam);
  const [maxPrice, setMaxPrice] = useState(maxPriceParam);
  const [showFilters, setShowFilters] = useState(false);

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
      .catch(() => {});
  }, []);

  useEffect(() => {
    setSearchInput(q);
    setMinPrice(minPriceParam);
    setMaxPrice(maxPriceParam);
    setPage(1);
    setIsLoading(true);
    setLoadError('');

    browseProducts({
      q,
      category,
      location: locationParam,
      sort,
      minPrice: minPriceParam,
      maxPrice: maxPriceParam,
      page: 1,
    })
      .then((data) => {
        setProducts(data.products || []);
        setTotal(data.total || 0);
      })
      .catch((err) => setLoadError(err.message || 'Could not load products.'))
      .finally(() => setIsLoading(false));
  }, [q, category, locationParam, sort, minPriceParam, maxPriceParam]);

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

  const handleLocationClick = (loc) => {
    const next = new URLSearchParams(searchParams);
    if (!loc || loc === locationParam) {
      next.delete('location');
    } else {
      next.set('location', loc);
    }
    setSearchParams(next);
  };

  const handleSortChange = (newSort) => {
    const next = new URLSearchParams(searchParams);
    if (newSort === 'newest') {
      next.delete('sort');
    } else {
      next.set('sort', newSort);
    }
    setSearchParams(next);
  };

  const handlePriceFilterSubmit = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (minPrice) next.set('minPrice', minPrice);
    else next.delete('minPrice');

    if (maxPrice) next.set('maxPrice', maxPrice);
    else next.delete('maxPrice');

    setSearchParams(next);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setMinPrice('');
    setMaxPrice('');
    setSearchParams(new URLSearchParams());
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setIsLoadingMore(true);
    browseProducts({
      q,
      category,
      location: locationParam,
      sort,
      minPrice: minPriceParam,
      maxPrice: maxPriceParam,
      page: nextPage,
    })
      .then((data) => {
        setProducts((prev) => [...prev, ...(data.products || [])]);
        setPage(nextPage);
      })
      .catch((err) => setLoadError(err.message || 'Could not load more products.'))
      .finally(() => setIsLoadingMore(false));
  };

  const hasActiveFilters = Boolean(q || category || locationParam || minPriceParam || maxPriceParam || sort !== 'newest');

  return (
    <div className="min-h-screen bg-gray-50/50">
      <PublicHeader />

      <main className="mx-auto max-w-6xl px-6 py-10 sm:px-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Explore Groceries</h1>
            <p className="mt-1 text-sm text-gray-500">
              Browse, compare prices across vendors, and order fresh food items in Nsukka.
            </p>
          </div>

          {/* Sort Selector & Filter Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                showFilters || minPriceParam || maxPriceParam
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter size={13} />
              <span>Price Filters</span>
            </button>

            <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700">
              <ArrowDownUp size={13} className="text-gray-400" />
              <select
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                aria-label="Sort products by"
                className="bg-transparent text-gray-800 focus:outline-hidden cursor-pointer"
              >
                <option value="newest">Sort: Newest</option>
                <option value="price_asc">Price: Low to High (Cheapest)</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mt-6 flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search for tomatoes, yams, rice, oil, meat…"
              className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-emerald-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
          >
            Search
          </button>
        </form>

        {/* Expandable Price Range Filter */}
        {showFilters && (
          <form
            onSubmit={handlePriceFilterSubmit}
            className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4"
          >
            <span className="text-xs font-bold text-emerald-900">Filter by Price:</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min ₦"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-24 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-900 focus:border-emerald-700 focus:outline-hidden"
              />
              <span className="text-gray-400 text-xs">to</span>
              <input
                type="number"
                placeholder="Max ₦"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-24 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-900 focus:border-emerald-700 focus:outline-hidden"
              />
            </div>
            <button
              type="submit"
              className="rounded-full bg-emerald-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Apply Filter
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 ml-auto"
              >
                <X size={13} />
                Reset All Filters
              </button>
            )}
          </form>
        )}

        {/* Categories Row */}
        {categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleCategoryClick('')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                !category
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.category_id}
                type="button"
                onClick={() => handleCategoryClick(cat.slug)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  category === cat.slug
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Location Filter Row (Nsukka Campus & Market Zones) */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-gray-500 mr-1 flex items-center gap-1">
            <MapPin size={12} className="text-emerald-700" />
            Location:
          </span>
          {['', 'Ogige Market', 'Hilltop', 'Behind Flat'].map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => handleLocationClick(loc)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                locationParam === loc
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {loc ? loc : 'All Nsukka'}
            </button>
          ))}
        </div>

        {/* Results Area */}
        <div className="mt-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-gray-400">
              <Loader2 size={24} className="animate-spin text-emerald-700" />
              <p className="text-sm">Finding fresh groceries…</p>
            </div>
          ) : loadError ? (
            <div role="alert" className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-700">
              {loadError}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-gray-200 bg-white py-16 text-center">
              <Package className="text-gray-300" size={32} />
              <p className="font-semibold text-gray-900">No matching products found</p>
              <p className="text-xs text-gray-500 max-w-sm">
                Try searching with another keyword or resetting price and category filters.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  Showing <strong className="text-gray-900">{products.length}</strong> of{' '}
                  <strong className="text-gray-900">{total}</strong> groceries
                </span>
                {sort === 'price_asc' && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-emerald-800 font-semibold">
                    Price Comparison: Cheapest First
                  </span>
                )}
              </div>

              {/* Products Grid */}
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => {
                  const imgSrc = getProductImageUrl(product);

                  return (
                    <div
                      key={product.product_id}
                      className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-gray-200 bg-white p-3.5 transition hover:border-emerald-300 hover:shadow-md"
                    >
                      <Link to={`/shop/${product.product_id}`}>
                        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100">
                          <img
                            src={imgSrc}
                            alt={product.name}
                            onError={(e) => handleImageFallback(e, product)}
                            className="h-full w-full object-cover transition group-hover:scale-105"
                          />

                          {/* Location Badge */}
                          <span className="absolute top-2 left-2 rounded-full bg-white/95 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold text-emerald-950 shadow-xs flex items-center gap-0.5">
                            <MapPin size={9} className="text-emerald-700" />
                            {product.market_zone || 'Ogige Market'}
                          </span>

                          {product.stock_quantity <= 0 && (
                            <span className="absolute right-2 bottom-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </Link>

                      <div className="mt-3 flex flex-1 flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-gray-400">
                            <span>{product.category_name}</span>
                            {product.average_rating > 0 && (
                              <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                                <Star size={11} className="fill-amber-400 text-amber-500" />
                                {product.average_rating}
                              </span>
                            )}
                          </div>

                          <Link
                            to={`/shop/${product.product_id}`}
                            className="mt-1 line-clamp-1 text-sm font-bold text-gray-900 group-hover:text-emerald-800"
                          >
                            {product.name}
                          </Link>

                          {/* Clickable Vendor Store Link */}
                          <Link
                            to={`/shop/vendor/${product.vendor_id}`}
                            className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-emerald-800 font-medium"
                          >
                            <Store size={12} className="text-emerald-700" />
                            <span className="truncate">{product.shop_name}</span>
                          </Link>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5">
                          <p className="text-sm font-extrabold text-emerald-900">
                            {formatNaira(product.price)}
                            <span className="text-[11px] font-normal text-gray-400">/{product.unit}</span>
                          </p>

                          <Link
                            to={`/shop/${product.product_id}`}
                            className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {products.length < total && (
                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-xs disabled:opacity-60"
                  >
                    {isLoadingMore ? 'Loading…' : 'Load more groceries'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ShopPage;
