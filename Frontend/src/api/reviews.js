import { API_BASE_URL, authHeaders, parseResponse } from './client.js';

export function getProductReviews(productId) {
  return fetch(`${API_BASE_URL}/api/reviews/product/${productId}`).then(parseResponse);
}

export function submitReview(token, { productId, rating, comment }) {
  return fetch(`${API_BASE_URL}/api/reviews`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ productId, rating, comment }),
  }).then(parseResponse);
}
