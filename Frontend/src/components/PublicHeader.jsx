import { Link } from 'react-router-dom';
import { Leaf, ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { getPostLoginPath } from '../utils/routing.js';

function PublicHeader({ links = [] }) {
  const { isAuthenticated, user } = useAuth();
  const { itemCount } = useCart();
  const isCustomer = isAuthenticated && user?.role === 'customer';

  return (
    <header className="flex items-center justify-between px-6 py-5 sm:px-12">
      <Link to="/" className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-800 text-white">
          <Leaf size={18} />
        </span>
        <span className="text-lg font-semibold text-gray-900">
          FreshBasket<span className="text-emerald-700">.</span>
        </span>
      </Link>

      {links.length > 0 && (
        <nav className="hidden items-center gap-8 text-sm font-medium text-gray-600 sm:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-gray-900">
              {link.label}
            </a>
          ))}
        </nav>
      )}

      <div className="flex items-center gap-3">
        {isCustomer && (
          <Link to="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-50">
            <ShoppingCart size={20} className="text-gray-700" />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[1.125rem] items-center justify-center rounded-full bg-emerald-800 px-1 text-[10px] font-semibold text-white">
                {itemCount}
              </span>
            )}
          </Link>
        )}
        {isAuthenticated ? (
          <Link
            to={getPostLoginPath(user)}
            className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Dashboard
          </Link>
        ) : (
          <>
            <Link to="/sign-in" className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export default PublicHeader;
