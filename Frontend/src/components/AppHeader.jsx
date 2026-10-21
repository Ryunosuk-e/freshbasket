import {
  ClipboardList,
  Leaf,
  LogOut,
  Package,
  ShoppingBag,
  ShoppingCart,
  Store,
  User,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

function AppHeader({ tag }) {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/sign-in', { replace: true });
  };

  const isCustomer = user?.role === 'customer';
  const isVendor = user?.role === 'vendor';
  const isAdmin = user?.role === 'admin';

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-md px-6 py-3.5 sm:px-12">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-800 text-white shadow-xs">
            <Leaf size={18} />
          </span>
          <span className="text-lg font-bold text-gray-900 tracking-tight">
            FreshBasket<span className="text-emerald-700">.</span>
          </span>
          {tag && (
            <span className="hidden sm:inline-block ml-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              {tag}
            </span>
          )}
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-gray-600">
          {isCustomer && (
            <>
              <Link
                to="/dashboard"
                className={`rounded-full px-3 py-1.5 transition ${
                  isActive('/dashboard') ? 'bg-emerald-50 font-semibold text-emerald-800' : 'hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/shop"
                className={`rounded-full px-3 py-1.5 transition ${
                  isActive('/shop') ? 'bg-emerald-50 font-semibold text-emerald-800' : 'hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Shop
              </Link>
              <Link
                to="/orders"
                className={`rounded-full px-3 py-1.5 transition ${
                  isActive('/orders') ? 'bg-emerald-50 font-semibold text-emerald-800' : 'hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                My Orders
              </Link>
              <Link
                to="/cart"
                className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${
                  isActive('/cart') ? 'bg-emerald-50 font-semibold text-emerald-800' : 'hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <ShoppingCart size={16} />
                <span>Cart</span>
                {itemCount > 0 && (
                  <span className="flex h-4.5 min-w-[1.125rem] items-center justify-center rounded-full bg-emerald-800 px-1 text-[10px] font-bold text-white">
                    {itemCount}
                  </span>
                )}
              </Link>
            </>
          )}

          {isVendor && (
            <>
              <Link
                to="/dashboard"
                className={`rounded-full px-3 py-1.5 transition ${
                  isActive('/dashboard') ? 'bg-emerald-50 font-semibold text-emerald-800' : 'hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Overview
              </Link>
              <Link
                to="/vendor/orders"
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${
                  isActive('/vendor/orders') ? 'bg-emerald-50 font-semibold text-emerald-800' : 'hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <ClipboardList size={15} />
                <span>Orders</span>
              </Link>
              <Link
                to="/vendor/products"
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${
                  isActive('/vendor/products') ? 'bg-emerald-50 font-semibold text-emerald-800' : 'hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Package size={15} />
                <span>Products</span>
              </Link>
            </>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className={`rounded-full px-3 py-1.5 transition ${
                isActive('/admin') ? 'bg-emerald-50 font-semibold text-emerald-800' : 'hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              Admin Control
            </Link>
          )}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50/80 px-3 py-1 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="font-semibold text-gray-800 truncate max-w-[120px]">{user?.full_name?.split(' ')[0]}</span>
            <span className="capitalize text-gray-400">({user?.role})</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3.5 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
            title="Sign out of FreshBasket"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
