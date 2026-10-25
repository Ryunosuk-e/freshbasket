import { API_BASE_URL, authHeaders, parseResponse } from './client.js';

export function getCategories() {
  return fetch(`${API_BASE_URL}/api/categories`).then(parseResponse);
}

export function getMyProducts(token) {
  return fetch(`${API_BASE_URL}/api/products/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(parseResponse);
}

// Deliberately does NOT set Content-Type — the browser has to generate the
// multipart boundary itself when the body is a FormData instance.
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

// Public — no token needed.
export function browseProducts({ q, category, vendor, minPrice, maxPrice, sort, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category) params.set('category', category);
  if (vendor) params.set('vendor', vendor);
  if (minPrice) params.set('minPrice', minPrice);
  if (maxPrice) params.set('maxPrice', maxPrice);
  if (sort) params.set('sort', sort);
  if (page > 1) params.set('page', String(page));
  if (limit !== 20) params.set('limit', String(limit));

  const qs = params.toString();
  return fetch(`${API_BASE_URL}/api/products${qs ? `?${qs}` : ''}`).then(parseResponse);
}

export function getProduct(productId) {
  return fetch(`${API_BASE_URL}/api/products/${productId}`).then(parseResponse);
}

export function getProductRecommendations(productId) {
  return fetch(`${API_BASE_URL}/api/products/${productId}/recommendations`).then(parseResponse);
}

export function getAdminAllProducts(token) {
  return fetch(`${API_BASE_URL}/api/products/admin/all`, {
    headers: authHeaders(token),
  }).then(parseResponse);
}

export function approveProduct(token, productId) {
  return fetch(`${API_BASE_URL}/api/products/admin/${productId}/approve`, {
    method: 'PATCH',
    headers: authHeaders(token),
  }).then(parseResponse);
}

export function rejectProduct(token, productId) {
  return fetch(`${API_BASE_URL}/api/products/admin/${productId}/reject`, {
    method: 'PATCH',
    headers: authHeaders(token),
  }).then(parseResponse);
}

export const getProducts = browseProducts;

export function getVendorPublicProfile(vendorId, token) {
  const headers = token ? authHeaders(token) : {};
  return fetch(`${API_BASE_URL}/api/vendors/${vendorId}`, { headers }).then(parseResponse);
}
