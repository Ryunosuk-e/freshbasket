import { API_BASE_URL, authHeaders, parseResponse } from './client.js';

export function getMyDeliveries(token) {
  return fetch(`${API_BASE_URL}/api/deliveries/mine`, {
    headers: authHeaders(token),
  }).then(parseResponse);
}

export function updateDeliveryStatus(token, assignmentId, status) {
  return fetch(`${API_BASE_URL}/api/deliveries/${assignmentId}/status`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  }).then(parseResponse);
}
