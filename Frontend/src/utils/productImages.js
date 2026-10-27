// Comprehensive image catalogue & smart fallback for authentic Nigerian produce and market goods in Nsukka
const FALLBACK_CATALOGUE = {
  // Tomatoes & Peppers
  'tomato': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=700&auto=format&fit=crop&q=80',
  'atarodo': 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=700&auto=format&fit=crop&q=80',
  'scotch bonnet': 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=700&auto=format&fit=crop&q=80',
  'pepper': 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=700&auto=format&fit=crop&q=80',
  'bell pepper': 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=700&auto=format&fit=crop&q=80',
  'tatase': 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=700&auto=format&fit=crop&q=80',
  'shombo': 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=700&auto=format&fit=crop&q=80',
  'cameroon pepper': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=700&auto=format&fit=crop&q=80',

  // Green Leafy Vegetables (Ugwu, Waterleaf, Bitterleaf, Oha, Scent leaf)
  'ugwu': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=700&auto=format&fit=crop&q=80',
  'fluted pumpkin': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=700&auto=format&fit=crop&q=80',
  'waterleaf': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=700&auto=format&fit=crop&q=80',
  'bitterleaf': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=700&auto=format&fit=crop&q=80',
  'oha': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=700&auto=format&fit=crop&q=80',
  'uziza': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=700&auto=format&fit=crop&q=80',
  'scent leaf': 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=700&auto=format&fit=crop&q=80',
  'spinach': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=700&auto=format&fit=crop&q=80',
  'vegetable': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=700&auto=format&fit=crop&q=80',
  'okra': 'https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=700&auto=format&fit=crop&q=80',
  'okro': 'https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=700&auto=format&fit=crop&q=80',
  'garden egg': 'https://images.unsplash.com/photo-1628773822503-930a84e93892?w=700&auto=format&fit=crop&q=80',
  'carrot': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?w=700&auto=format&fit=crop&q=80',
  'cabbage': 'https://images.unsplash.com/photo-1550989460-0adc9554f529?w=700&auto=format&fit=crop&q=80',
  'onion': 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=700&auto=format&fit=crop&q=80',
  'ginger': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=700&auto=format&fit=crop&q=80',
  'garlic': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=700&auto=format&fit=crop&q=80',

  // Plantains & Fruits
  'plantain': 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=700&auto=format&fit=crop&q=80',
  'banana': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=700&auto=format&fit=crop&q=80',
  'orange': 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=700&auto=format&fit=crop&q=80',
  'pineapple': 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=700&auto=format&fit=crop&q=80',
  'watermelon': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=700&auto=format&fit=crop&q=80',
  'apple': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=700&auto=format&fit=crop&q=80',

  // Tubers (Yam, Cocoyam, Sweet Potato, Cassava)
  'yam': 'https://images.unsplash.com/photo-1596450514735-111a2fe0ac82?w=700&auto=format&fit=crop&q=80',
  'potato': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=700&auto=format&fit=crop&q=80',
  'sweet potato': 'https://images.unsplash.com/photo-1590868309235-ea34bed7bd7f?w=700&auto=format&fit=crop&q=80',
  'cocoyam': 'https://images.unsplash.com/photo-1596450514735-111a2fe0ac82?w=700&auto=format&fit=crop&q=80',

  // Grains, Rice, Beans & Cereals
  'rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=700&auto=format&fit=crop&q=80',
  'mama gold': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=700&auto=format&fit=crop&q=80',
  'abakaliki': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=700&auto=format&fit=crop&q=80',
  'royal stallion': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=700&auto=format&fit=crop&q=80',
  'big bull': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=700&auto=format&fit=crop&q=80',
  'beans': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=700&auto=format&fit=crop&q=80',
  'oloyin': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=700&auto=format&fit=crop&q=80',
  'garri': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=700&auto=format&fit=crop&q=80',
  'ijebu garri': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=700&auto=format&fit=crop&q=80',
  'yellow garri': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=700&auto=format&fit=crop&q=80',
  'semovita': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=700&auto=format&fit=crop&q=80',
  'semolina': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=700&auto=format&fit=crop&q=80',
  'wheat meal': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=700&auto=format&fit=crop&q=80',
  'amala': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=700&auto=format&fit=crop&q=80',
  'fufu': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=700&auto=format&fit=crop&q=80',
  'spaghetti': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=700&auto=format&fit=crop&q=80',
  'noodles': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=700&auto=format&fit=crop&q=80',
  'indomie': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=700&auto=format&fit=crop&q=80',

  // Spices, Thickners & Seasonings
  'egusi': 'https://images.unsplash.com/photo-1546548970-71785318a17b?w=700&auto=format&fit=crop&q=80',
  'ogbono': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=700&auto=format&fit=crop&q=80',
  'achi': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=700&auto=format&fit=crop&q=80',
  'ofor': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=700&auto=format&fit=crop&q=80',
  'crayfish': 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=700&auto=format&fit=crop&q=80',
  'maggi': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=700&auto=format&fit=crop&q=80',
  'knorr': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=700&auto=format&fit=crop&q=80',
  'curry': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=700&auto=format&fit=crop&q=80',
  'thyme': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=700&auto=format&fit=crop&q=80',
  'nutmeg': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=700&auto=format&fit=crop&q=80',
  'ehuru': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=700&auto=format&fit=crop&q=80',
  'uda': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=700&auto=format&fit=crop&q=80',
  'iru': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=700&auto=format&fit=crop&q=80',
  'dawadawa': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=700&auto=format&fit=crop&q=80',
  'suya pepper': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=700&auto=format&fit=crop&q=80',
  'palm oil': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=700&auto=format&fit=crop&q=80',
  'vegetable oil': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=700&auto=format&fit=crop&q=80',
  'oil': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=700&auto=format&fit=crop&q=80',

  // Meat, Poultry & Seafood
  'beef': 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=700&auto=format&fit=crop&q=80',
  'cow meat': 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=700&auto=format&fit=crop&q=80',
  'goat meat': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=700&auto=format&fit=crop&q=80',
  'chicken': 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=700&auto=format&fit=crop&q=80',
  'turkey': 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=700&auto=format&fit=crop&q=80',
  'fish': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=700&auto=format&fit=crop&q=80',
  'catfish': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=700&auto=format&fit=crop&q=80',
  'stockfish': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=700&auto=format&fit=crop&q=80',
  'okporoko': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=700&auto=format&fit=crop&q=80',
  'smoked fish': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=700&auto=format&fit=crop&q=80',

  // Cooking Utensils & Kitchenware
  'mortar': 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=700&auto=format&fit=crop&q=80',
  'pestle': 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=700&auto=format&fit=crop&q=80',
  'frying pan': 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=700&auto=format&fit=crop&q=80',
  'pan': 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=700&auto=format&fit=crop&q=80',
  'pot set': 'https://images.unsplash.com/photo-1584990347449-397a66b533db?w=700&auto=format&fit=crop&q=80',
  'pot': 'https://images.unsplash.com/photo-1584990347449-397a66b533db?w=700&auto=format&fit=crop&q=80',
  'knife': 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=700&auto=format&fit=crop&q=80',
  'chopping board': 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=700&auto=format&fit=crop&q=80',
  'blender': 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=700&auto=format&fit=crop&q=80',
  'gas cylinder': 'https://images.unsplash.com/photo-1584990347449-397a66b533db?w=700&auto=format&fit=crop&q=80',
  'stove': 'https://images.unsplash.com/photo-1584990347449-397a66b533db?w=700&auto=format&fit=crop&q=80',

  // Dairy, Eggs & Beverages
  'egg': 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=700&auto=format&fit=crop&q=80',
  'milk': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=700&auto=format&fit=crop&q=80',
  'peak milk': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=700&auto=format&fit=crop&q=80',
  'milo': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=700&auto=format&fit=crop&q=80',
  'water': 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=700&auto=format&fit=crop&q=80',

  default: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=700&auto=format&fit=crop&q=80',
};

export function getProductImageUrl(product) {
  if (!product) return FALLBACK_CATALOGUE.default;

  // 1. If images array exists and has valid primary/first image
  if (Array.isArray(product.images) && product.images.length > 0) {
    const primary = product.images.find((img) => img.isPrimary || img.is_primary);
    const url = primary?.imageUrl || primary?.image_url || product.images[0]?.imageUrl || product.images[0]?.image_url;
    if (url && typeof url === 'string' && url.trim().length > 0 && !url.includes('placeholder')) {
      return url;
    }
  }

  // 2. Direct property image_url or imageUrl
  if (product.image_url && typeof product.image_url === 'string' && product.image_url.trim().length > 0 && !product.image_url.includes('placeholder')) {
    return product.image_url;
  }
  if (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.trim().length > 0 && !product.imageUrl.includes('placeholder')) {
    return product.imageUrl;
  }

  // 3. Smart Keyword matching
  const name = (product.name || product.product_name || '').toLowerCase();
  for (const [key, fallbackUrl] of Object.entries(FALLBACK_CATALOGUE)) {
    if (key !== 'default' && name.includes(key)) {
      return fallbackUrl;
    }
  }

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
