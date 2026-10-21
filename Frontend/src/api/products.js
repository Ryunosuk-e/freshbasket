import { API_BASE_URL, parseResponse } from './client.js';

export function getCategories() {
  return fetch(`${API_BASE_URL}/api/categories`).then(parseResponse);
}

export function getMyProducts(token) {
  return fetch(`${API_BASE_URL}/api/products/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(parseResponse);
}

// Deliberately does NOT set Content-Type — the browser has to generate the
// multipart boundary itself when the body is a FormData instance. Setting
// it manually here would break every upload.
function buildProductFormData(fields, imageFiles) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value);
    }
  });
  imageFiles.forEach((file) => formData.append('images', file));
  return formData;
}

export function createProduct(token, fields, imageFiles = []) {
  return fetch(`${API_BASE_URL}/api/products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: buildProductFormData(fields, imageFiles),
  }).then(parseResponse);
}

export function updateProduct(token, productId, fields, imageFiles = []) {
  return fetch(`${API_BASE_URL}/api/products/${productId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: buildProductFormData(fields, imageFiles),
  }).then(parseResponse);
}

// Public — no token. { category } is a slug (e.g. "fruits-vegetables"),
// matching the ones seeded in the backend and used on the landing page.
export function browseProducts({ q, category, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category) params.set('category', category);
  params.set('page', page);
  params.set('limit', limit);
  return fetch(`${API_BASE_URL}/api/products?${params.toString()}`).then(parseResponse);
}

export function getProduct(productId) {
  return fetch(`${API_BASE_URL}/api/products/${productId}`).then(parseResponse);
}
