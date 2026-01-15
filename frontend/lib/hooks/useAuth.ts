/**
 * React Hooks for Authentication
 * Provides typed access to auth functionality with state management
 */
'use client';

import { useState, useCallback, useEffect } from 'react';
import { authApi, AuthResponse, SignupRequest, LoginRequest } from '../api/auth.api';
import { parseApiError, FormattedError } from '../error-handler';
import { UserJwt } from '../api/client';

export interface UseAuthState {
  user: UserJwt | null;
  loading: boolean;
  error: FormattedError | null;
  isAuthenticated: boolean;
}

/**
 * Hook for authentication state
 */
export function useAuth() {
  const [state, setState] = useState<UseAuthState>({
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false,
  });

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authApi.getCurrentUser();
        setState({
          user: user as UserJwt,
          loading: false,
          error: null,
          isAuthenticated: true,
        });
      } catch {
        setState({
          user: null,
          loading: false,
          error: null,
          isAuthenticated: false,
        });
      }
    };

    checkAuth();
  }, []);

  const signup = useCallback(async (dto: SignupRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await authApi.signup(dto);
      setState({
        user: response.user as any,
        loading: false,
        error: null,
        isAuthenticated: true,
      });
      return response;
    } catch (error) {
      const formatted = parseApiError(error);
      setState((prev) => ({ ...prev, loading: false, error: formatted }));
      throw error;
    }
  }, []);

  const login = useCallback(async (dto: LoginRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await authApi.login(dto);
      setState({
        user: response.user as any,
        loading: false,
        error: null,
        isAuthenticated: true,
      });
      return response;
    } catch (error) {
      const formatted = parseApiError(error);
      setState((prev) => ({ ...prev, loading: false, error: formatted }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      await authApi.logout();
      setState({
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      });
    } catch (error) {
      const formatted = parseApiError(error);
      setState((prev) => ({ ...prev, loading: false, error: formatted }));
      // Still clear auth on logout error
      setTimeout(() => {
        setState({
          user: null,
          error: null,
          loading: false,
          isAuthenticated: false,
        });
      }, 100);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const response = await authApi.refreshToken();
      setState((prev) => ({
        ...prev,
        user: response.user as any,
      }));
      return response;
    } catch (error) {
      const formatted = parseApiError(error);
      setState((prev) => ({ ...prev, error: formatted }));
      throw error;
    }
  }, []);

  return {
    ...state,
    signup,
    login,
    logout,
    refreshToken,
  };
}

/**
 * Hook for password reset flow
 */
export function usePasswordReset() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FormattedError | null>(null);
  const [success, setSuccess] = useState(false);

  const requestReset = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await authApi.requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      const formatted = parseApiError(err);
      setError(formatted);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await authApi.resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      const formatted = parseApiError(err);
      setError(formatted);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, success, requestReset, resetPassword };
}
