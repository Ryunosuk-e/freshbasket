import { API_BASE_URL, authHeaders, parseResponse } from './client.js';

export function getCheckoutSummary(token, fulfillmentType = 'delivery') {
  return fetch(`${API_BASE_URL}/api/orders/checkout-summary?fulfillmentType=${fulfillmentType}`, {
    headers: authHeaders(token),
  }).then(parseResponse);
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

export function getVendorOrders(token) {
  return fetch(`${API_BASE_URL}/api/orders/vendor`, { headers: authHeaders(token) }).then(parseResponse);
}

export function updateOrderStatus(token, orderId, status) {
  return fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  }).then(parseResponse);
}

export function confirmOrderPayment(token, orderId) {
  return fetch(`${API_BASE_URL}/api/orders/${orderId}/confirm-payment`, {
    method: 'PATCH',
    headers: authHeaders(token),
  }).then(parseResponse);
}

export function submitOrderDispute(token, orderId, reason) {
  return fetch(`${API_BASE_URL}/api/disputes/order/${orderId}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ reason }),
  }).then(parseResponse);
}

export function getAllDisputes(token) {
  return fetch(`${API_BASE_URL}/api/disputes`, { headers: authHeaders(token) }).then(parseResponse);
}

export function resolveDispute(token, disputeId, status, resolution) {
  return fetch(`${API_BASE_URL}/api/disputes/${disputeId}/resolve`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status, resolution }),
  }).then(parseResponse);
}

export function getAdminOrders(token) {
  return fetch(`${API_BASE_URL}/api/admin/orders`, { headers: authHeaders(token) }).then(parseResponse);
}
