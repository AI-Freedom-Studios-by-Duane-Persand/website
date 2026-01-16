import { apiClient } from '../api/client';

/**
 * Build Authorization headers with current token (if present).
 * - Default to JSON content type.
 * - Works in client and server; token comes from apiClient state.
 */
export function getAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extra || {}),
  };

  // apiClient maintains token and will inject it internally, but
  // some direct fetch calls may still rely on explicit headers.
  const tokenPayload = apiClient.parseToken();
  if (tokenPayload && typeof window !== 'undefined') {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch {}
  }

  return headers;
}
