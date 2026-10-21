import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ClipboardList,
  Clock,
  Package,
  ShoppingBag,
  ShoppingBasket,
  Sparkles,
  Store,
  Truck,
} from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function DashboardPage() {
  const { user } = useAuth();
  const isVendor = user?.role === 'vendor';
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-gray-50/50">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-6 py-12 sm:px-12">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-800 to-emerald-950 p-8 text-white sm:p-10 shadow-lg">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-700/60 px-3.5 py-1 text-xs font-medium text-emerald-100 backdrop-blur-xs">
              <Sparkles size={14} />
              {isVendor ? 'Vendor Portal Active' : 'Verified Local Grocery Shopper'}
            </div>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
              {isVendor ? `Welcome to your shop, ${firstName}!` : `Welcome back, ${firstName}!`}
            </h1>
            <p className="mt-2.5 text-sm text-emerald-100/90 leading-relaxed sm:text-base">
              {isVendor
                ? 'Manage your grocery catalogue, review incoming buyer orders, and keep track of deliveries all in one place.'
                : 'Fresh groceries sourced directly from verified Nsukka vendors, delivered right to your doorstep.'}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {isVendor ? (
                <>
                  <Link
                    to="/vendor/orders"
                    className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50 shadow-sm"
                  >
                    <ClipboardList size={16} />
                    View Orders
                  </Link>
                  <Link
                    to="/vendor/products"
                    className="flex items-center gap-2 rounded-full bg-emerald-700/80 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 border border-emerald-600"
                  >
                    <Package size={16} />
                    Manage Products
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/shop"
                    className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50 shadow-sm"
                  >
                    <ShoppingBag size={16} />
                    Browse Groceries
                  </Link>
                  <Link
                    to="/orders"
                    className="flex items-center gap-2 rounded-full bg-emerald-700/80 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 border border-emerald-600"
                  >
                    <Clock size={16} />
                    My Order History
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Access Grid */}
        <h2 className="mt-10 text-lg font-bold text-gray-900">Quick Access & Features</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isVendor ? (
            <>
              <Link
                to="/vendor/orders"
                className="group flex flex-col justify-between rounded-3xl border border-gray-200 bg-white p-6 transition hover:border-emerald-300 hover:shadow-md"
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                    <ClipboardList size={22} />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-gray-900 group-hover:text-emerald-800">Shop Orders</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Review orders placed by customers, view delivery addresses, and advance order status.
                  </p>
                </div>
                <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  Open Order Manager <ArrowRight size={14} className="transition group-hover:translate-x-1" />
                </div>
              </Link>

              <Link
                to="/vendor/products"
                className="group flex flex-col justify-between rounded-3xl border border-gray-200 bg-white p-6 transition hover:border-emerald-300 hover:shadow-md"
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                    <Package size={22} />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-gray-900 group-hover:text-emerald-800">My Products</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Add new grocery items, update prices, upload photos, and toggle active listing visibility.
                  </p>
                </div>
                <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  Manage Catalogue <ArrowRight size={14} className="transition group-hover:translate-x-1" />
                </div>
              </Link>

              <div className="flex flex-col justify-between rounded-3xl border border-gray-200 bg-white p-6">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <Store size={22} />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-gray-900">Verified Storefront</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Your store is active and verified. Payouts are routed directly to your configured bank account.
                  </p>
                </div>
                <span className="mt-5 inline-block text-xs font-medium text-emerald-700">Status: Verified & Live</span>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/shop"
                className="group flex flex-col justify-between rounded-3xl border border-gray-200 bg-white p-6 transition hover:border-emerald-300 hover:shadow-md"
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                    <ShoppingBasket size={22} />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-gray-900 group-hover:text-emerald-800">Explore Fresh Produce</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Fruits, vegetables, grains, tubers, meat, poultry, and daily market essentials from Ogige market.
                  </p>
                </div>
                <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  Go to Shop <ArrowRight size={14} className="transition group-hover:translate-x-1" />
                </div>
              </Link>

              <Link
                to="/orders"
                className="group flex flex-col justify-between rounded-3xl border border-gray-200 bg-white p-6 transition hover:border-emerald-300 hover:shadow-md"
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <Clock size={22} />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-gray-900 group-hover:text-emerald-800">Order History & Tracking</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Monitor live delivery progress, view receipts, and review past orders.
                  </p>
                </div>
                <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  Check Orders <ArrowRight size={14} className="transition group-hover:translate-x-1" />
                </div>
              </Link>

              <div className="flex flex-col justify-between rounded-3xl border border-gray-200 bg-white p-6">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                    <Truck size={22} />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-gray-900">Nsukka Local Delivery</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Fast fulfillment across campus, Hilltop, Ofulonu, UNN environs, and Ogige market radius.
                  </p>
                </div>
                <span className="mt-5 inline-block text-xs font-medium text-purple-700">Same-Day Available</span>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
