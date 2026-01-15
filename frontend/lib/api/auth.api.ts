/**
 * Authentication API Client
 * All endpoints related to authentication and user sessions
 */
import { apiClient } from './client';

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  role?: 'superadmin' | 'tenantOwner' | 'manager' | 'editor';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
  };
}

export const authApi = {
  /**
   * Sign up new user
   */
  signup: async (dto: SignupRequest) => {
    const response = await apiClient.post<AuthResponse>('/auth/signup', dto);
    if (response.access_token) {
      apiClient.setAuthToken(response.access_token);
    }
    return response;
  },

  /**
   * Login user
   */
  login: async (dto: LoginRequest) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', dto);
    if (response.access_token) {
      apiClient.setAuthToken(response.access_token);
    }
    return response;
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      await apiClient.post('/auth/logout', {});
    } finally {
      apiClient.clearAuthToken();
    }
  },

  /**
   * Get current user
   */
  getCurrentUser: async () => {
    return apiClient.get('/auth/me');
  },

  /**
   * Refresh auth token
   */
  refreshToken: async () => {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', {});
    if (response.access_token) {
      apiClient.setAuthToken(response.access_token);
    }
    return response;
  },

  /**
   * Request password reset
   */
  requestPasswordReset: async (email: string) => {
    return apiClient.post('/auth/request-password-reset', { email });
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token: string, newPassword: string) => {
    return apiClient.post('/auth/reset-password', { token, newPassword });
  },
};
