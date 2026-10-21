import { API_BASE_URL, authHeaders, parseResponse } from './client.js';

export function getMyCustomerProfile(token) {
  return fetch(`${API_BASE_URL}/api/customers/me`, { headers: authHeaders(token) }).then(parseResponse);
}

export function completeCustomerProfile(token, payload) {
  return fetch(`${API_BASE_URL}/api/customers/me`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  }).then(parseResponse);
}

export const updateCustomerProfile = completeCustomerProfile;

export function getMyVendorProfile(token) {
  return fetch(`${API_BASE_URL}/api/vendors/me`, { headers: authHeaders(token) }).then(parseResponse);
}

export function completeVendorProfile(token, payload) {
  return fetch(`${API_BASE_URL}/api/vendors/me`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  }).then(parseResponse);
}

export const updateVendorProfile = completeVendorProfile;
