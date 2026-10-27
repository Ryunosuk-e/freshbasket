import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  CreditCard,
  Fish,
  Home as HomeIcon,
  Leaf,
  MapPin,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Search,
  Package,
  Coffee,
  Heart,
  ShoppingCart,
  Utensils,
  Flame,
} from 'lucide-react';
import PublicHeader from '../components/PublicHeader.jsx';
import Footer from '../components/Footer.jsx';
import { getProducts } from '../api/products.js';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { addToCart as apiAddToCart } from '../api/cart.js';
import { getProductImageUrl, handleImageFallback } from '../utils/productImages.js';

const NAV_LINKS = [
  { href: '#market-deals', label: 'Produce Deals' },
  { href: '#categories', label: 'Categories' },
  { href: '#hubs', label: 'Nsukka Hubs' },
  { href: '#faq', label: 'FAQ' },
];

const TRUST_BADGES = [
  {
    icon: ShieldCheck,
    title: 'Verified Nsukka Vendors',
    body: 'Traders in Ogige Market, Hilltop and campus zones vetted by platform administrators.',
  },
  {
    icon: Truck,
    title: 'Speedy Hostel Delivery',
    body: 'Dedicated motorcycle dispatch riders deliver directly to Franco, Bello, Balewa, and lodges.',
  },
  {
    icon: CreditCard,
    title: 'Paystack Card & Bank Transfer',
    body: 'Instant, secure checkout with Debit Card and instant Bank Transfer verification.',
  },
];

const MARKET_CATEGORIES = [
  {
    slug: 'fruits-vegetables',
    label: 'Fresh Fruits & Vegetables',
    desc: 'Farm-fresh tomatoes, peppers, ugwu, waterleaf & plantains direct from Ogige farmers.',
    icon: Leaf,
    badgeColor: 'bg-emerald-100 text-emerald-800',
  },
  {
    slug: 'grains-cereals',
    label: 'Grains, Rice & Flours',
    desc: 'Abakaliki stone-free rice, Mama Gold, Ijebu garri, Semovita & honey beans.',
    icon: Package,
    badgeColor: 'bg-amber-100 text-amber-800',
  },
  {
    slug: 'meat-fish',
    label: 'Fresh Butchery, Poultry & Seafood',
    desc: 'Prime beef, tender goat meat, live pond catfish and original Norwegian stockfish.',
    icon: Fish,
    badgeColor: 'bg-rose-100 text-rose-800',
  },
  {
    slug: 'spices-seasonings',
    label: 'Cooking Spices, Thickners & Pure Oils',
    desc: 'Clean crayfish, Ogbono, Egusi, Maggi cubes, pure Nsukka palm oil & vegetable oil.',
    icon: Flame,
    badgeColor: 'bg-orange-100 text-orange-800',
  },
  {
    slug: 'cooking-utensils',
    label: 'Cooking Utensils & Kitchen Essentials',
    desc: 'Heavy hardwood mortar & pestle, non-stick frying pans, stainless steel pot sets & knives.',
    icon: Utensils,
    badgeColor: 'bg-indigo-100 text-indigo-800',
  },
  {
    slug: 'packaged-foods',
    label: 'Provisions, Dairy & Beverages',
    desc: 'Indomie cartons, Peak milk, farm-crated eggs, Milo and bottled drinking water.',
    icon: Coffee,
    badgeColor: 'bg-sky-100 text-sky-800',
  },
];

const HUBS = [
  { name: 'Ogige Modern Market', desc: 'Main commercial agricultural trade center in Nsukka town.', tag: 'Hub 1' },
  { name: 'Hilltop Commercial Line', desc: 'Fast pickup near Campus Gate, Odenigwe road.', tag: 'Hub 2' },
  { name: 'Behind Flat / Market Rd', desc: 'Popular provisions and foodstuff hub for off-campus students.', tag: 'Hub 3' },
  { name: 'UNN Hostels Direct', desc: 'Doorstep rider drop-off at Franco, Bello, Balewa, Akpabio.', tag: 'Campus' },
];

const FAQS = [
  {
    question: 'How fast is delivery to campus hostels?',
    answer:
      'Orders within UNN campus (Franco, Bello, Balewa, Okpara) and Hilltop are typically fulfilled in 25–40 minutes by dedicated local motorcycle dispatch riders.',
  },
  {
    question: 'How do packaging options (like Indomie cartons or bags of rice) work?',
    answer:
      'Vendors list products by unit or bulk tiers (e.g. Single Pack, Half Carton 20 pcs, Full Carton 40 pcs, Paint Bucket 4kg, Half Bag 25kg). On each product page, simply choose your tier and pricing adjusts automatically.',
  },
  {
    question: 'What payment options are available?',
    answer:
      'For Home / Hostel Delivery, payment via Paystack Debit Card or Instant Bank Transfer is integrated seamlessly. For Self-Pickup from the vendor stall, Cash on Pickup is also supported.',
  },
  {
    question: 'How do vendors get verified?',
    answer:
      'Vendors submit their personal identity (NIN), market union permit/stall proof, and bank payout details through our dedicated Vendor KYC Portal. Platform administrators inspect and verify all details before their shop goes live.',
  },
];

function FaqItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border-b border-gray-100 py-4">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between text-left">
        <span className="text-sm font-semibold text-gray-900">{question}</span>
        <ChevronDown size={18} className={`shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <p className="mt-2 text-xs leading-relaxed text-gray-500">{answer}</p>}
    </div>
  );
}

function ProductCard({ product }) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { refreshCart } = useCart();
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const isFavorited = isInWishlist(product.product_id);
  const imgSrc = getProductImageUrl(product);

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/sign-in', { state: { message: 'Please sign in to add items to your cart.' } });
      return;
    }
    setAdding(true);
    try {
      await apiAddToCart(token, product.product_id, 1);
      refreshCart();
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-gray-200 bg-white p-3 transition hover:border-emerald-300 hover:shadow-md">
      <div>
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100">
          <Link to={`/shop/${product.product_id}`}>
            <img
              src={imgSrc}
              alt={product.name}
              onError={(e) => handleImageFallback(e, product)}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          </Link>

          {/* Hub Tag */}
          <span className="absolute top-2 left-2 rounded-full bg-white/95 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-emerald-950 shadow-xs flex items-center gap-1">
            <MapPin size={10} className="text-emerald-700 shrink-0" />
            <span className="truncate max-w-[100px]">{product.market_zone || 'Ogige Market'}</span>
          </span>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product);
            }}
            title={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-gray-500 hover:text-rose-600 transition shadow-xs"
          >
            <Heart size={14} className={isFavorited ? 'text-rose-600 fill-rose-600' : ''} />
          </button>
        </div>

        <div className="mt-3">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block truncate">
            {product.category_name || 'Grocery Item'}
          </span>
          <Link
            to={`/shop/${product.product_id}`}
            className="mt-0.5 line-clamp-2 text-xs sm:text-sm font-bold text-gray-900 group-hover:text-emerald-800 leading-snug"
            title={product.name}
          >
            {product.name}
          </Link>
          <p className="mt-0.5 text-[11px] text-gray-500 truncate">{product.shop_name}</p>
        </div>
      </div>

      <div className="mt-3 border-t border-gray-100 pt-2.5">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <span className="text-sm font-black text-gray-900">
              ₦{Number(product.price).toLocaleString()}
            </span>
            <span className="ml-1 text-[10px] text-gray-400">/{product.unit}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={adding}
          className={`w-full flex items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-semibold transition ${
            added
              ? 'bg-emerald-700 text-white'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-800 hover:text-white'
          }`}
        >
          {added ? (
            <>
              <CheckCircle2 size={13} />
              <span>Added</span>
            </>
          ) : (
            <>
              <ShoppingCart size={13} />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    getProducts({ limit: 80, sort: 'newest' })
      .then((data) => {
        setAllProducts(data.products || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingProducts(false));
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/shop');
    }
  };

  // Helper to filter products by category matching either slug or broad keywords
  const getProductsForCategory = (catSlug) => {
    if (catSlug === 'fruits-vegetables') {
      return allProducts.filter(
        (p) =>
          p.category_name?.toLowerCase().includes('fruit') ||
          p.category_name?.toLowerCase().includes('vegetable')
      );
    }
    if (catSlug === 'grains-cereals') {
      return allProducts.filter(
        (p) =>
          p.category_name?.toLowerCase().includes('grain') ||
          p.category_name?.toLowerCase().includes('flour') ||
          p.category_name?.toLowerCase().includes('swallow')
      );
    }
    if (catSlug === 'meat-fish') {
      return allProducts.filter(
        (p) =>
          p.category_name?.toLowerCase().includes('meat') ||
          p.category_name?.toLowerCase().includes('fish') ||
          p.category_name?.toLowerCase().includes('seafood')
      );
    }
    if (catSlug === 'spices-seasonings') {
      return allProducts.filter(
        (p) =>
          p.category_name?.toLowerCase().includes('spice') ||
          p.category_name?.toLowerCase().includes('seasoning') ||
          p.category_name?.toLowerCase().includes('thickener') ||
          p.category_name?.toLowerCase().includes('soup')
      );
    }
    if (catSlug === 'cooking-utensils') {
      return allProducts.filter(
        (p) =>
          p.category_name?.toLowerCase().includes('utensil') ||
          p.category_name?.toLowerCase().includes('kitchen')
      );
    }
    if (catSlug === 'packaged-foods') {
      return allProducts.filter(
        (p) =>
          p.category_name?.toLowerCase().includes('packaged') ||
          p.category_name?.toLowerCase().includes('dairy') ||
          p.category_name?.toLowerCase().includes('beverage') ||
          p.category_name?.toLowerCase().includes('essential')
      );
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-gray-50/40 text-gray-900 font-sans">
      <PublicHeader links={NAV_LINKS} />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 text-white px-6 pt-16 pb-24 sm:px-12 sm:pt-20 sm:pb-32">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="mx-auto max-w-5xl text-center relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl sm:leading-tight lg:text-6xl">
            Fresh Groceries From <br className="hidden sm:inline" />
            <span className="text-emerald-300">Nsukka&rsquo;s Local Markets</span>, At Your Door
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-emerald-100/90">
            Skip the trek and transport fare to Ogige Market. Browse live stock from verified traders, compare prices,
            and enjoy quick delivery straight to your UNN campus hostel or lodge.
          </p>

          {/* Hero Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-full border border-white/20 bg-white/95 p-1.5 shadow-2xl backdrop-blur-md"
          >
            <div className="flex flex-1 items-center gap-2 px-3 text-gray-400">
              <Search size={18} className="text-emerald-700" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tomatoes, yam, garri, semovita, catfish, spices, pots…"
                className="w-full bg-transparent text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-full bg-emerald-800 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
            >
              <span>Search</span>
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Quick Hub Pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] text-emerald-200">
            <span className="font-semibold text-white">Hubs:</span>
            <Link to="/shop?location=Ogige" className="rounded-full bg-white/10 px-3 py-1 hover:bg-white/20 transition">
              📍 Ogige Market
            </Link>
            <Link to="/shop?location=Hilltop" className="rounded-full bg-white/10 px-3 py-1 hover:bg-white/20 transition">
              📍 Hilltop Junction
            </Link>
            <Link to="/shop?location=Behind" className="rounded-full bg-white/10 px-3 py-1 hover:bg-white/20 transition">
              📍 Behind Flat
            </Link>
            <Link to="/shop" className="rounded-full bg-white/10 px-3 py-1 hover:bg-white/20 transition">
              📍 UNN Hostels Direct
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Badges Bar */}
      <section className="-mt-10 mx-auto max-w-6xl px-6 relative z-20 sm:px-12">
        <div className="grid gap-4 rounded-3xl border border-gray-200/80 bg-white p-6 shadow-xl sm:grid-cols-3">
          {TRUST_BADGES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-start gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 shadow-xs">
                <Icon size={20} />
              </span>
              <div>
                <p className="text-sm font-bold text-gray-900">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Visual Bar */}
      <section id="categories" className="mx-auto max-w-6xl px-6 pt-16 pb-8 sm:px-12">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Browse Departments</span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Shop By Food Category</h2>
          </div>
          <Link to="/shop" className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1">
            All Products <ArrowRight size={14} />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {MARKET_CATEGORIES.map(({ slug, label, icon: Icon, badgeColor }) => (
            <Link
              key={slug}
              to={`/shop?category=${slug}`}
              className="flex flex-col items-center rounded-3xl border border-gray-200 bg-white p-4 text-center transition hover:border-emerald-300 hover:bg-emerald-50/30 hover:shadow-xs group"
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${badgeColor} transition group-hover:scale-105`}>
                <Icon size={22} />
              </span>
              <p className="mt-3 text-xs font-bold text-gray-800 line-clamp-1">{label}</p>
              <p className="mt-0.5 text-[10px] text-gray-400">View items &rarr;</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Jumia-Style Categorized Product Listings */}
      <div id="market-deals" className="mx-auto max-w-6xl px-6 space-y-12 pb-16 sm:px-12">
        {MARKET_CATEGORIES.map(({ slug, label, desc, icon: Icon, badgeColor }) => {
          const categoryProducts = getProductsForCategory(slug);
          if (categoryProducts.length === 0 && !loadingProducts) return null;

          return (
            <section key={slug} className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-xs">
              {/* Category Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${badgeColor}`}>
                    <Icon size={20} />
                  </span>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900">{label}</h3>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                </div>

                <Link
                  to={`/shop?category=${slug}`}
                  className="flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-800 hover:text-white transition"
                >
                  <span>See All Deals</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {/* Product Shelf Grid */}
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {categoryProducts.slice(0, 4).map((p) => (
                  <ProductCard key={p.product_id} product={p} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Nsukka Market Hubs Spotlight */}
      <section id="hubs" className="bg-emerald-900 text-white py-16">
        <div className="mx-auto max-w-6xl px-6 sm:px-12">
          <div className="text-center">
            <span className="rounded-full bg-emerald-800 px-3 py-1 text-xs font-semibold text-emerald-200">
              Geospatial Campus Coverage
            </span>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Serving Nsukka Market Hubs</h2>
            <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-emerald-100/80">
              Select vendors based on proximity to Franco, Bello, Balewa, or Hilltop for fastest dispatch.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HUBS.map((hub) => (
              <div key={hub.name} className="rounded-3xl border border-emerald-700/50 bg-emerald-950/40 p-5 backdrop-blur-sm">
                <span className="inline-block rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  {hub.tag}
                </span>
                <p className="mt-3 text-sm font-bold text-white">{hub.name}</p>
                <p className="mt-1 text-xs text-emerald-200/70">{hub.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="mx-auto max-w-3xl px-6 py-16 sm:px-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Frequently Asked Questions</h2>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">Everything you need to know about ordering on FreshBasket.</p>
        </div>

        <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
          {FAQS.map((faq, index) => (
            <FaqItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              isOpen={openFaq === index}
              onToggle={() => setOpenFaq(openFaq === index ? -1 : index)}
            />
          ))}
        </div>
      </section>

      {/* Ready To Order Banner */}
      <section className="mx-auto max-w-6xl px-6 pb-16 sm:px-12">
        <div className="flex flex-col items-start gap-6 rounded-3xl bg-emerald-800 p-8 sm:p-12 sm:flex-row sm:items-center sm:justify-between text-white shadow-xl">
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">Ready To Order Fresh Groceries?</h2>
            <p className="mt-2 text-xs sm:text-sm text-emerald-100">
              Join students and residents shopping smart across Nsukka today.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/shop"
              className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs sm:text-sm font-bold text-emerald-900 hover:bg-emerald-50 transition shadow-sm"
            >
              Start Shopping
              <ArrowRight size={15} />
            </Link>
            <Link
              to="/register"
              state={{ role: 'vendor' }}
              className="flex items-center gap-2 rounded-full border border-emerald-600 bg-emerald-900/40 px-6 py-3 text-xs sm:text-sm font-bold text-white hover:bg-emerald-900 transition"
            >
              Sell as a Vendor
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default LandingPage;
