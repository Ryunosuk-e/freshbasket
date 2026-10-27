import { createContext, useContext, useEffect, useState } from 'react';

const WishlistContext = createContext(null);

const STORAGE_KEY = 'freshbasket_wishlist';

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error('Failed to save wishlist:', err);
    }
  }, [items]);

  const isInWishlist = (productId) => {
    return items.some((item) => Number(item.product_id) === Number(productId));
  };

  const addToWishlist = (product) => {
    if (!product || isInWishlist(product.product_id)) return;
    setItems((prev) => [product, ...prev]);
  };

  const removeFromWishlist = (productId) => {
    setItems((prev) => prev.filter((item) => Number(item.product_id) !== Number(productId)));
  };

  const toggleWishlist = (product) => {
    if (!product) return;
    if (isInWishlist(product.product_id)) {
      removeFromWishlist(product.product_id);
    } else {
      addToWishlist(product);
    }
  };

  const clearWishlist = () => {
    setItems([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems: items,
        wishlistCount: items.length,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
