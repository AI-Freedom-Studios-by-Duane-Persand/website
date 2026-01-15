/**
 * Base API Client for Frontend
 * Handles authentication, error handling, and centralized HTTP requests
 */
export interface UserJwt {
  sub: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  iat: number;
  exp: number;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  userFriendlyMessage?: string;
  validationErrors?: Array<{
    field: string;
    message: string;
  }>;
  timestamp: string;
  path: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiErrorResponse;
}

export class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.loadAuthToken();
  }

  /**
   * Load auth token from localStorage or cookies
   */
  private loadAuthToken(): void {
    if (typeof window === 'undefined') return;

    try {
      // Try to get from localStorage first
      const token = localStorage.getItem('authToken');
      if (token) {
        this.authToken = token;
      }
    } catch (error) {
      console.warn('Failed to load auth token:', error);
    }
  }

  /**
   * Set auth token manually
   */
  setAuthToken(token: string): void {
    this.authToken = token;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('authToken', token);
      } catch (error) {
        console.warn('Failed to save auth token:', error);
      }
    }
  }

  /**
   * Clear auth token
   */
  clearAuthToken(): void {
    this.authToken = null;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('authToken');
      } catch (error) {
        console.warn('Failed to clear auth token:', error);
      }
    }
  }

  /**
   * Get auth headers
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Parse JWT token
   */
  parseToken(): UserJwt | null {
    if (!this.authToken) return null;

    try {
      const base64Url = this.authToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to parse JWT token:', error);
      return null;
    }
  }

  /**
   * Make HTTP GET request
   */
  async get<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * Make HTTP POST request
   */
  async post<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make HTTP PUT request
   */
  async put<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make HTTP PATCH request
   */
  async patch<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make HTTP DELETE request
   */
  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * Core request method with error handling
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = { ...this.getHeaders(), ...(options.headers as Record<string, string>) };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized - token may have expired
      if (response.status === 401) {
        this.clearAuthToken();
        // Trigger auth state update (can dispatch to store or call callback)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth-expired'));
        }
        throw new Error('Authentication expired. Please login again.');
      }

      const data = await response.json();

      if (!response.ok) {
        const errorResponse: ApiErrorResponse = data || {
          statusCode: response.status,
          message: response.statusText,
          userFriendlyMessage: this.getUserFriendlyMessage(response.status),
          timestamp: new Date().toISOString(),
          path: endpoint,
        };

        throw this.formatError(errorResponse);
      }

      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Request failed: ${String(error)}`);
    }
  }

  /**
   * Format error response for frontend consumption
   */
  private formatError(error: ApiErrorResponse): Error & { details?: ApiErrorResponse } {
    const message = error.userFriendlyMessage || error.message;
    const err = new Error(message) as Error & { details?: ApiErrorResponse };
    err.details = error;
    return err;
  }

  /**
   * Get user-friendly error message based on HTTP status
   */
  private getUserFriendlyMessage(statusCode: number): string {
    const messages: Record<number, string> = {
      400: 'Invalid request. Please check your input.',
      401: 'Please login to continue.',
      403: 'You do not have permission to perform this action.',
      404: 'Resource not found.',
      429: 'Too many requests. Please try again later.',
      500: 'Server error. Please try again later.',
    };

    return messages[statusCode] || 'An unexpected error occurred. Please try again.';
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
