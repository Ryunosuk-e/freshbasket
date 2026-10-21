import { API_BASE_URL, authHeaders, parseResponse } from './client.js';

export function getCheckoutSummary(token) {
  return fetch(`${API_BASE_URL}/api/orders/checkout-summary`, { headers: authHeaders(token) }).then(parseResponse);
}

export function placeOrder(token, payload) {
  return fetch(`${API_BASE_URL}/api/orders`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  }).then(parseResponse);
}

export function getMyOrders(token) {
  return fetch(`${API_BASE_URL}/api/orders`, { headers: authHeaders(token) }).then(parseResponse);
}

export function getOrder(token, orderId) {
  return fetch(`${API_BASE_URL}/api/orders/${orderId}`, { headers: authHeaders(token) }).then(parseResponse);
}
