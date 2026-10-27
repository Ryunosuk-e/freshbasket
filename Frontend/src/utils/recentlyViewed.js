const RECENTLY_VIEWED_KEY = 'freshbasket_recently_viewed';
const MAX_RECENT = 10;

export function recordRecentlyViewed(product) {
  if (!product || !product.product_id) return;
  try {
    const existing = getRecentlyViewed();
    const filtered = existing.filter((p) => Number(p.product_id) !== Number(product.product_id));
    const updated = [
      {
        product_id: product.product_id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        category_name: product.category_name,
        market_zone: product.market_zone,
        shop_name: product.shop_name,
        images: product.images,
        image_url: product.image_url,
      },
      ...filtered,
    ].slice(0, MAX_RECENT);

    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save recently viewed:', err);
  }
}

export function getRecentlyViewed() {
  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function clearRecentlyViewed() {
  try {
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
  } catch {}
}
