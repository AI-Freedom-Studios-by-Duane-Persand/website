/**
 * Centralized Auth Headers Utility
 * Replaces scattered implementations across components
 */
import { apiClient } from '../api/client';

/**
 * Get authorization headers with JWT token
 */
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = apiClient['authToken'] || getTokenFromStorage();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Get token from localStorage (fallback)
 */
function getTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return localStorage.getItem('authToken');
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getTokenFromStorage();
}

/**
 * Get current user from token
 */
export function getCurrentUser(): any | null {
  return apiClient.parseToken();
}

/**
 * Set auth token
 */
export function setAuthToken(token: string): void {
  apiClient.setAuthToken(token);
}

/**
 * Clear auth token
 */
export function clearAuthToken(): void {
  apiClient.clearAuthToken();
}

/**
 * Get bearer token
 */
export function getBearerToken(): string | null {
  const token = getTokenFromStorage();
  return token ? `Bearer ${token}` : null;
}
