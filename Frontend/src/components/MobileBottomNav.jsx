import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, ShoppingCart, ClipboardList, User, Truck, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function MobileBottomNav() {
  const { user, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();

  const isCustomer = user?.role === 'customer' || !isAuthenticated;
  const isVendor = user?.role === 'vendor';
  const isAgent = user?.role === 'agent';
  const isAdmin = user?.role === 'admin';

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200/80 bg-white/95 backdrop-blur-md px-3 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe">
      <div className="flex items-center justify-around">
        {/* Marketplace Home */}
        <Link
          to="/shop"
          className={`flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1 text-[11px] font-medium transition ${
            isActive('/shop') || isActive('/')
              ? 'text-emerald-800 font-bold'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <ShoppingBag size={20} className={isActive('/shop') || isActive('/') ? 'text-emerald-800' : ''} />
          <span>Shop</span>
        </Link>

        {/* Customer Cart or Vendor Overview */}
        {isCustomer && (
          <Link
            to="/cart"
            className={`relative flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1 text-[11px] font-medium transition ${
              isActive('/cart') ? 'text-emerald-800 font-bold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <div className="relative">
              <ShoppingCart size={20} className={isActive('/cart') ? 'text-emerald-800' : ''} />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-emerald-800 px-1 text-[9px] font-extrabold text-white">
                  {itemCount}
                </span>
              )}
            </div>
            <span>Cart</span>
          </Link>
        )}

        {isVendor && (
          <Link
            to="/vendor/products"
            className={`flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1 text-[11px] font-medium transition ${
              isActive('/vendor/products') ? 'text-emerald-800 font-bold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <LayoutDashboard size={20} className={isActive('/vendor/products') ? 'text-emerald-800' : ''} />
            <span>Products</span>
          </Link>
        )}

        {/* Orders / Runs */}
        {isCustomer && (
          <Link
            to="/orders"
            className={`flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1 text-[11px] font-medium transition ${
              isActive('/orders') ? 'text-emerald-800 font-bold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <ClipboardList size={20} className={isActive('/orders') ? 'text-emerald-800' : ''} />
            <span>Orders</span>
          </Link>
        )}

        {isVendor && (
          <Link
            to="/vendor/orders"
            className={`flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1 text-[11px] font-medium transition ${
              isActive('/vendor/orders') ? 'text-emerald-800 font-bold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <ClipboardList size={20} className={isActive('/vendor/orders') ? 'text-emerald-800' : ''} />
            <span>Orders</span>
          </Link>
        )}

        {isAgent && (
          <Link
            to="/agent/deliveries"
            className={`flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1 text-[11px] font-medium transition ${
              isActive('/agent/deliveries') ? 'text-emerald-800 font-bold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Truck size={20} className={isActive('/agent/deliveries') ? 'text-emerald-800' : ''} />
            <span>Deliveries</span>
          </Link>
        )}

        {isAdmin && (
          <Link
            to="/admin"
            className={`flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1 text-[11px] font-medium transition ${
              isActive('/admin') ? 'text-emerald-800 font-bold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <LayoutDashboard size={20} className={isActive('/admin') ? 'text-emerald-800' : ''} />
            <span>Admin</span>
          </Link>
        )}

        {/* Profile / Account */}
        <Link
          to={isAuthenticated ? '/profile' : '/sign-in'}
          className={`flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1 text-[11px] font-medium transition ${
            isActive('/profile') || isActive('/sign-in')
              ? 'text-emerald-800 font-bold'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <User size={20} className={isActive('/profile') || isActive('/sign-in') ? 'text-emerald-800' : ''} />
          <span>{isAuthenticated ? 'Account' : 'Sign In'}</span>
        </Link>
      </div>
    </nav>
  );
}
