import { Link } from 'react-router-dom';
import { Package, ShoppingBasket, Store } from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function DashboardPage() {
  const { user } = useAuth();
  const isVendor = user?.role === 'vendor';
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  const teaserItems = isVendor
    ? ['Verified storefront', 'Payouts to your bank', 'Order management (coming soon)']
    : ['Verified local vendors', 'Card or cash on delivery', 'Fast Nsukka delivery (coming soon)'];

  return (
    <div className="min-h-screen bg-white">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-6 py-16 sm:px-12">
        <div className="flex flex-col items-start gap-4 rounded-3xl bg-emerald-50 p-10">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-800 text-white">
            {isVendor ? <Store size={22} /> : <ShoppingBasket size={22} />}
          </span>
          <h1 className="text-3xl font-semibold text-gray-900">
            {isVendor ? `Welcome to your shop, ${firstName}` : `Welcome back, ${firstName}`}
          </h1>
          <p className="max-w-xl text-gray-600">
            {isVendor
              ? "Your account is set up. Add what you're selling below, and order management is next up on the build."
              : 'Your account is ready — browse what local Nsukka vendors have in stock below. Ordering is next up on the build.'}
          </p>
          {isVendor ? (
            <Link
              to="/vendor/products"
              className="flex items-center gap-2 rounded-full bg-emerald-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <Package size={16} />
              Manage Products
            </Link>
          ) : (
            <Link
              to="/shop"
              className="flex items-center gap-2 rounded-full bg-emerald-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <ShoppingBasket size={16} />
              Browse Groceries
            </Link>
          )}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {teaserItems.map((item) => (
            <div key={item} className="rounded-2xl border border-gray-100 p-5 text-sm font-medium text-gray-700">
              {item}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
