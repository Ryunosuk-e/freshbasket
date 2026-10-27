import { API_BASE_URL, authHeaders, parseResponse } from './client.js';

export function submitVendorKyc(token, kycData) {
  return fetch(`${API_BASE_URL}/api/vendors/kyc`, {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(kycData),
  }).then(parseResponse);
}

export function getMyVendorKyc(token) {
  return fetch(`${API_BASE_URL}/api/vendors/kyc`, {
    headers: authHeaders(token),
  }).then(parseResponse);
}

export function getAdminAllKyc(token, status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return fetch(`${API_BASE_URL}/api/admin/kyc${query}`, {
    headers: authHeaders(token),
  }).then(parseResponse);
}

export function reviewAdminKyc(token, submissionId, { decision, rejectionReason }) {
  return fetch(`${API_BASE_URL}/api/admin/kyc/${submissionId}/review`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ decision, rejectionReason }),
  }).then(parseResponse);
}
