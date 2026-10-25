// Smart image resolver & fallback for Nigerian produce and groceries in Nsukka
const FALLBACK_CATALOGUE = {
  tomatoes: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
  pepper: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80',
  atarodo: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80',
  plantain: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=600&auto=format&fit=crop&q=80',
  indomie: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
  noodles: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
  yam: 'https://images.unsplash.com/photo-1596450514735-111a2fe0ac82?w=600&auto=format&fit=crop&q=80',
  rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
  oil: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
  egg: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&auto=format&fit=crop&q=80',
  beef: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&auto=format&fit=crop&q=80',
  meat: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&auto=format&fit=crop&q=80',
  fish: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=80',
  catfish: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=80',
  garri: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
};

export function getProductImageUrl(product) {
  if (!product) return FALLBACK_CATALOGUE.default;

  // 1. If images array exists and has entries
  if (Array.isArray(product.images) && product.images.length > 0) {
    const primary = product.images.find((img) => img.isPrimary || img.is_primary);
    const url = primary?.imageUrl || primary?.image_url || product.images[0]?.imageUrl || product.images[0]?.image_url;
    if (url && typeof url === 'string' && url.trim().length > 0) {
      return url;
    }
  }

  // 2. Direct imageUrl property (e.g. from cart or orders item)
  if (product.image_url && typeof product.image_url === 'string' && product.image_url.trim().length > 0) {
    return product.image_url;
  }
  if (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.trim().length > 0) {
    return product.imageUrl;
  }

  // 3. Keyword matching based on product name
  const name = (product.name || product.product_name || '').toLowerCase();
  for (const [key, fallbackUrl] of Object.entries(FALLBACK_CATALOGUE)) {
    if (key !== 'default' && name.includes(key)) {
      return fallbackUrl;
    }
  }

  // 4. Default fresh food market produce
  return FALLBACK_CATALOGUE.default;
}

export function handleImageFallback(e, product) {
  e.currentTarget.onerror = null;
  const name = (product?.name || product?.product_name || '').toLowerCase();
  for (const [key, fallbackUrl] of Object.entries(FALLBACK_CATALOGUE)) {
    if (key !== 'default' && name.includes(key)) {
      e.currentTarget.src = fallbackUrl;
      return;
    }
  }
  e.currentTarget.src = FALLBACK_CATALOGUE.default;
}
