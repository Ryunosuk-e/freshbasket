import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, ShoppingCart, Heart, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';

export default function MobileBottomNav() {
  const { user, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const accountPath = isAuthenticated
    ? user?.role === 'admin'
      ? '/admin'
      : user?.role === 'vendor'
      ? '/dashboard'
      : '/profile'
    : '/sign-in';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200/80 bg-white/95 backdrop-blur-md px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe">
      <div className="grid grid-cols-5 items-center justify-around text-center">
        {/* 1. Home */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1 text-[10px] font-medium transition ${
            isActive('/') && location.pathname === '/'
              ? 'text-emerald-800 font-bold'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Home size={20} className={isActive('/') && location.pathname === '/' ? 'text-emerald-800' : ''} />
          <span>Home</span>
        </Link>

        {/* 2. Shop */}
        <Link
          to="/shop"
          className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1 text-[10px] font-medium transition ${
            isActive('/shop')
              ? 'text-emerald-800 font-bold'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <ShoppingBag size={20} className={isActive('/shop') ? 'text-emerald-800' : ''} />
          <span>Shop</span>
        </Link>

        {/* 3. Cart */}
        <Link
          to="/cart"
          className={`relative flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1 text-[10px] font-medium transition ${
            isActive('/cart') ? 'text-emerald-800 font-bold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <div className="relative">
            <ShoppingCart size={20} className={isActive('/cart') ? 'text-emerald-800' : ''} />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-emerald-800 px-1 text-[9px] font-extrabold text-white">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </div>
          <span>Cart</span>
        </Link>

        {/* 4. Wishlist */}
        <Link
          to="/wishlist"
          className={`relative flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1 text-[10px] font-medium transition ${
            isActive('/wishlist') ? 'text-emerald-800 font-bold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <div className="relative">
            <Heart size={20} className={isActive('/wishlist') ? 'text-emerald-800 fill-emerald-800' : ''} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-extrabold text-white">
                {wishlistCount > 9 ? '9+' : wishlistCount}
              </span>
            )}
          </div>
          <span>Wishlist</span>
        </Link>

        {/* 5. Account */}
        <Link
          to={accountPath}
          className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1 text-[10px] font-medium transition ${
            isActive('/profile') || isActive('/dashboard') || isActive('/admin')
              ? 'text-emerald-800 font-bold'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <User
            size={20}
            className={
              isActive('/profile') || isActive('/dashboard') || isActive('/admin')
                ? 'text-emerald-800'
                : ''
            }
          />
          <span>Account</span>
        </Link>
      </div>
    </nav>
  );
}
