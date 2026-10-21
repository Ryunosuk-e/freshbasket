import { ShoppingBasket, Store } from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function HomePage() {
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
              ? 'Your account is set up. Product listings and order management are next up on the build — for now, this confirms registration, sign-in, and profile completion all work end to end.'
              : 'Your account is ready. Browsing and ordering from local Nsukka vendors is next up on the build — for now, this confirms registration, sign-in, and profile completion all work end to end.'}
          </p>
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

export default HomePage;
