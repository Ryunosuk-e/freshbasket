import { Link } from 'react-router-dom';
import { Leaf, ArrowLeft, Home, ShoppingBag } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-800 shadow-sm">
        <Leaf size={32} />
      </div>
      <span className="mt-4 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
        404 — FreshBasket
      </span>
      <h1 className="mt-4 text-3xl font-extrabold text-gray-900 sm:text-4xl">
        Page Not Found
      </h1>
      <p className="mt-3 max-w-md text-sm text-gray-500">
        We couldn&apos;t find the page you are looking for. It might have been moved or doesn&apos;t exist on our localized Nsukka marketplace.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/shop"
          className="flex items-center gap-2 rounded-full bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
        >
          <ShoppingBag size={16} />
          Explore Marketplace
        </Link>
        <Link
          to="/"
          className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
        >
          <Home size={16} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
