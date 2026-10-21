import { API_BASE_URL, parseResponse } from './client.js';

export function registerCustomer(payload) {
  return fetch(`${API_BASE_URL}/api/auth/register/customer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(parseResponse);
}

export function registerVendor(payload) {
  return fetch(`${API_BASE_URL}/api/auth/register/vendor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(parseResponse);
}

export function login(payload) {
  return fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(parseResponse);
}
