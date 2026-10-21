import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { getCart } from '../api/cart.js';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated, user, token } = useAuth();
  const [itemCount, setItemCount] = useState(0);

  // Only customers have a cart — vendors/admins always show 0, no request made.
  const refreshCart = useCallback(() => {
    if (!isAuthenticated || user?.role !== 'customer') {
      setItemCount(0);
      return;
    }
    getCart(token)
      .then((data) => {
        const count = (data.items || []).reduce((sum, item) => sum + item.quantity, 0);
        setItemCount(count);
      })
      .catch(() => {
        // Non-fatal — the badge just doesn't update this time.
      });
  }, [isAuthenticated, user, token]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  return <CartContext.Provider value={{ itemCount, refreshCart }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
