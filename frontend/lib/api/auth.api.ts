import { apiClient } from './client';

/**
 * Authentication API Client
 * Unified, token-aware wrappers around auth endpoints.
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    role?: string;
    tenantId?: string;
  };
}

export const authApi = {
  // Sign up: accept flexible DTO to match backend variations
  signup: async (dto: Record<string, any>) => {
    const response = await apiClient.post<AuthResponse>('/auth/signup', dto);
    const token = response.access_token || response.token;
    if (token) apiClient.setAuthToken(token);
    return response;
  },

  // Login user
  login: async (dto: LoginRequest) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', dto);
    const token = response.access_token || response.token;
    if (token) apiClient.setAuthToken(token);
    return response;
  },

  // Logout user
  logout: async () => {
    try {
      await apiClient.post('/auth/logout', {});
    } finally {
      apiClient.clearAuthToken();
    }
  },

  // Current user
  getCurrentUser: async () => {
    return apiClient.get('/auth/me');
  },

  // Refresh token
  refreshToken: async () => {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', {});
    const token = response.access_token || response.token;
    if (token) apiClient.setAuthToken(token);
    return response;
  },

  // Password reset
  requestPasswordReset: async (email: string) => {
    return apiClient.post('/auth/request-password-reset', { email });
  },

  resetPassword: async (token: string, newPassword: string) => {
    return apiClient.post('/auth/reset-password', { token, newPassword });
  },
};
