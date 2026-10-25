import { API_BASE_URL, authHeaders, parseResponse } from './client.js';

export function getMyNotifications(token) {
  return fetch(`${API_BASE_URL}/api/notifications`, {
    headers: authHeaders(token),
  }).then(parseResponse);
}

export function markNotificationRead(token, notificationId) {
  return fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: authHeaders(token),
  }).then(parseResponse);
}

export function markAllNotificationsRead(token) {
  return fetch(`${API_BASE_URL}/api/notifications/read-all`, {
    method: 'PATCH',
    headers: authHeaders(token),
  }).then(parseResponse);
}
