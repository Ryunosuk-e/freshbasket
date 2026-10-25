import { API_BASE_URL, authHeaders, parseResponse } from './client.js';

export function getCart(token) {
  return fetch(`${API_BASE_URL}/api/cart`, { headers: authHeaders(token) }).then(parseResponse);
}

export function addToCart(token, productId, quantity = 1, packagingUnit = 'Single Unit', unitPrice = null) {
  return fetch(`${API_BASE_URL}/api/cart/items`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ productId, quantity, packagingUnit, unitPrice }),
  }).then(parseResponse);
}

export function updateCartItem(token, productId, quantity) {
  return fetch(`${API_BASE_URL}/api/cart/items/${productId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ quantity }),
  }).then(parseResponse);
}

export function removeCartItem(token, productId) {
  return fetch(`${API_BASE_URL}/api/cart/items/${productId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  }).then(parseResponse);
}
