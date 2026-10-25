import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Carrot,
  ChevronDown,
  CreditCard,
  CupSoda,
  Fish,
  Home as HomeIcon,
  Leaf,
  Milk,
  Package,
  Search,
  ShieldCheck,
  Star,
  Truck,
  UserPlus,
  Wheat,
  MapPin,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import PublicHeader from '../components/PublicHeader.jsx';
import Footer from '../components/Footer.jsx';
import { getProducts } from '../api/products.js';
import { getProductImageUrl, handleImageFallback } from '../utils/productImages.js';

const NAV_LINKS = [
  { href: '#explore', label: 'Fresh Produce' },
  { href: '#categories', label: 'Categories' },
  { href: '#hubs', label: 'Nsukka Hubs' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#faq', label: 'FAQ' },
];

const TRUST_BADGES = [
  {
    icon: ShieldCheck,
    title: 'Verified Nsukka Vendors',
    body: 'Traders in Ogige Market and campus areas vetted by platform administrators.',
  },
  {
    icon: Truck,
    title: 'Speedy Hostel Delivery',
    body: 'Dedicated riders dispatch directly to Bello, Franco, Hilltop and environs.',
  },
  {
    icon: CreditCard,
    title: 'Card & Bank Transfer',
    body: 'Secure Paystack checkout with instant bank transfer verification.',
  },
];

const CATEGORIES = [
  { icon: Carrot, label: 'Fruits & Vegetables', slug: 'fruits-vegetables', count: 'Fresh daily' },
  { icon: Wheat, label: 'Grains & Cereals', slug: 'grains-cereals', count: 'Rice, Yam, Garri' },
  { icon: Milk, label: 'Dairy & Eggs', slug: 'dairy-eggs', count: 'Farm crated eggs' },
  { icon: Fish, label: 'Meat & Fish', slug: 'meat-fish', count: 'Beef & live catfish' },
  { icon: CupSoda, label: 'Beverages', slug: 'beverages', count: 'Drinks & water' },
  { icon: HomeIcon, label: 'Household Essentials', slug: 'household-essentials', count: 'Provisions' },
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
      'Orders within UNN campus (Franco, Bello, Balewa, Okpara) and Hilltop are typically fulfilled in 25–40 minutes by our dedicated motorcycle dispatch riders.',
  },
  {
    question: 'How do packaging options (like Indomie cartons) work?',
    answer:
      'Vendors list products by unit or bulk tiers (e.g. Single Pack, Half Carton 20 pcs, Full Carton 40 pcs). On the product page, simply choose your tier and quantity; pricing adjusts automatically.',
  },
  {
    question: 'What payment options are available?',
    answer:
      'For Home / Hostel Delivery, payment via Debit Card (Paystack) or Direct Bank Transfer is required. When choosing Self-Pickup from the vendor stall, Cash on Pickup is also available.',
  },
  {
    question: 'How do vendors get verified?',
    answer:
      'Vendors submit their stall location, market zone, and bank details upon registration. FreshBasket platform administrators review and approve them before their shop goes live.',
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

function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    getProducts({ limit: 4, sort: 'newest' })
      .then((data) => setFeaturedProducts(data.products || []))
      .catch(() => {});
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/shop');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/40 text-gray-900 font-sans">
      <PublicHeader links={NAV_LINKS} />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 text-white px-6 pt-16 pb-24 sm:px-12 sm:pt-20 sm:pb-32">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="mx-auto max-w-5xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-800/60 px-4 py-1.5 text-xs font-semibold text-emerald-200 backdrop-blur-md shadow-xs">
            <Sparkles size={14} className="text-amber-400" />
            <span>UNN Final Year Computer Science Innovation • 2026</span>
          </div>

          <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-5xl sm:leading-tight lg:text-6xl">
            Fresh Groceries From <br className="hidden sm:inline" />
            <span className="text-emerald-300">Nsukka&rsquo;s Local Markets</span>, At Your Door
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-emerald-100/90">
            Skip the trek and transport fare to Ogige Market. Browse live stock, compare prices across vendors,
            and enjoy quick delivery straight to your UNN campus hostel or off-campus lodge.
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
                placeholder="Search tomatoes, yam, garri, indomie, catfish…"
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

      {/* Featured Produce Showcase */}
      <section id="explore" className="mx-auto max-w-6xl px-6 pt-16 pb-12 sm:px-12">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Fresh Produce</span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Today&rsquo;s Market Selections
            </h2>
          </div>
          <Link to="/shop" className="flex items-center gap-1 text-xs font-bold text-emerald-800 hover:underline">
            View All Marketplace
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featuredProducts.map((p) => {
            const imgUrl = getProductImageUrl(p);
            return (
              <div
                key={p.product_id}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-gray-200 bg-white p-3.5 transition hover:border-emerald-300 hover:shadow-md"
              >
                <Link to={`/shop/${p.product_id}`}>
                  <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100">
                    <img
                      src={imgUrl}
                      alt={p.name}
                      onError={(e) => handleImageFallback(e, p)}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                    <span className="absolute top-2 left-2 rounded-full bg-white/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-emerald-900 shadow-xs flex items-center gap-1">
                      <MapPin size={10} className="text-emerald-700" />
                      {p.market_zone || 'Ogige Market'}
                    </span>
                  </div>
                </Link>

                <div className="mt-3 flex flex-1 flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      {p.category_name}
                    </span>
                    <Link
                      to={`/shop/${p.product_id}`}
                      className="mt-0.5 line-clamp-1 text-xs sm:text-sm font-bold text-gray-900 group-hover:text-emerald-800"
                    >
                      {p.name}
                    </Link>
                    <p className="mt-0.5 text-[11px] text-gray-500">{p.shop_name}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5">
                    <div>
                      <span className="text-xs sm:text-sm font-extrabold text-gray-900">
                        ₦{Number(p.price).toLocaleString()}
                      </span>
                      <span className="ml-1 text-[10px] text-gray-400">/{p.unit}</span>
                    </div>
                    <Link
                      to={`/shop/${p.product_id}`}
                      className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-800 hover:text-white transition"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Categories Grid */}
      <section id="categories" className="mx-auto max-w-6xl px-6 py-12 sm:px-12">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Categories</span>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Shop By Food Category</h2>
          <p className="mx-auto mt-2 max-w-lg text-xs sm:text-sm text-gray-500">
            Browse verified listings from food traders across Nsukka agricultural markets.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map(({ icon: Icon, label, slug, count }) => (
            <Link
              key={label}
              to={`/shop?category=${slug}`}
              className="flex flex-col items-center rounded-3xl border border-gray-200 bg-white p-5 text-center transition hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-xs"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                <Icon size={22} />
              </span>
              <p className="mt-3 text-xs font-bold text-gray-800">{label}</p>
              <p className="mt-0.5 text-[10px] text-gray-400">{count}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Nsukka Market Hubs Spotlight */}
      <section id="hubs" className="bg-emerald-900 text-white py-16">
        <div className="mx-auto max-w-6xl px-6 sm:px-12">
          <div className="text-center">
            <span className="rounded-full bg-emerald-800 px-3 py-1 text-xs font-semibold text-emerald-200">
              Localized Geospatial Coverage
            </span>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Serving Nsukka Market Hubs</h2>
            <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-emerald-100/80">
              Each product shows where the vendor is located so you can pick vendors closest to you for lightning-fast delivery.
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

      {/* CTA Box */}
      <section className="mx-auto max-w-6xl px-6 pb-16 sm:px-12">
        <div className="flex flex-col items-start gap-6 rounded-3xl bg-emerald-800 p-8 sm:p-12 sm:flex-row sm:items-center sm:justify-between text-white shadow-xl">
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">Ready To Order Fresh Groceries?</h2>
            <p className="mt-2 text-xs sm:text-sm text-emerald-100">
              Join UNN students and residents shopping smart in Nsukka today.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/shop"
              className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs sm:text-sm font-bold text-emerald-900 hover:bg-emerald-50 transition"
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
