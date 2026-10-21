import { API_BASE_URL, authHeaders, parseResponse } from './client.js';

export function getPlatformStats(token) {
  return fetch(`${API_BASE_URL}/api/admin/stats`, { headers: authHeaders(token) }).then(parseResponse);
}

export function getAllVendors(token) {
  return fetch(`${API_BASE_URL}/api/admin/vendors`, { headers: authHeaders(token) }).then(parseResponse);
}

export function getAllCustomers(token) {
  return fetch(`${API_BASE_URL}/api/admin/customers`, { headers: authHeaders(token) }).then(parseResponse);
}

export function getPendingVendors(token) {
  return fetch(`${API_BASE_URL}/api/vendors/pending`, { headers: authHeaders(token) }).then(parseResponse);
}

export function verifyVendor(token, vendorId) {
  return fetch(`${API_BASE_URL}/api/vendors/${vendorId}/verify`, {
    method: 'PATCH',
    headers: authHeaders(token),
  }).then(parseResponse);
}

export function rejectVendor(token, vendorId) {
  return fetch(`${API_BASE_URL}/api/vendors/${vendorId}/reject`, {
    method: 'PATCH',
    headers: authHeaders(token),
  }).then(parseResponse);
}
