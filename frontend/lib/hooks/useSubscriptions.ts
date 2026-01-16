/**
 * React Hooks for Subscriptions API
 * Provides typed access to subscription data with loading and error states
 */
'use client';

import { useState, useCallback } from 'react';
import { subscriptionsApi, SubscriptionDto, PackageDto } from '../api/subscriptions.api';
import { parseApiError, ApiErrorResponse } from '../error-handler';

export interface UseSubscriptionsState {
  packages: PackageDto[];
  currentSubscription: SubscriptionDto | null;
  loading: boolean;
  error: ApiErrorResponse | null;
}

/**
 * Hook for managing subscriptions
 */
export function useSubscriptions() {
  const [state, setState] = useState<UseSubscriptionsState>({
    packages: [],
    currentSubscription: null,
    loading: false,
    error: null,
  });

  const listPackages = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const packages = await subscriptionsApi.listPackages();
      setState((prev) => ({ ...prev, packages, loading: false }));
      return packages;
    } catch (error) {
      const formatted = parseApiError(error);
      setState((prev) => ({ ...prev, loading: false, error: formatted }));
      throw error;
    }
  }, []);

  const getCurrentSubscription = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const subscription = await subscriptionsApi.getCurrentSubscription();
      setState((prev) => ({ ...prev, currentSubscription: subscription as SubscriptionDto, loading: false }));
      return subscription;
    } catch (error) {
      const formatted = parseApiError(error);
      setState((prev) => ({ ...prev, loading: false, error: formatted }));
      throw error;
    }
  }, []);

  const createSubscription = useCallback(async (packageId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const subscription = await subscriptionsApi.create(packageId);
      setState((prev) => ({ ...prev, currentSubscription: subscription as SubscriptionDto, loading: false }));
      return subscription;
    } catch (error) {
      const formatted = parseApiError(error);
      setState((prev) => ({ ...prev, loading: false, error: formatted }));
      throw error;
    }
  }, []);

  const upgradeSubscription = useCallback(
    async (subscriptionId: string, packageId: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const subscription = await subscriptionsApi.upgrade(subscriptionId, packageId);
        setState((prev) => ({ ...prev, currentSubscription: subscription as SubscriptionDto, loading: false }));
        return subscription;
      } catch (error) {
        const formatted = parseApiError(error);
        setState((prev) => ({ ...prev, loading: false, error: formatted }));
        throw error;
      }
    },
    []
  );

  const cancelSubscription = useCallback(async (subscriptionId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await subscriptionsApi.cancel(subscriptionId);
      setState((prev) => ({ ...prev, currentSubscription: null, loading: false }));
    } catch (error) {
      const formatted = parseApiError(error);
      setState((prev) => ({ ...prev, loading: false, error: formatted }));
      throw error;
    }
  }, []);

  const createCheckoutSession = useCallback(async (packageId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const session = await subscriptionsApi.createCheckoutSession(packageId);
      setState((prev) => ({ ...prev, loading: false }));
      return session;
    } catch (error) {
      const formatted = parseApiError(error);
      setState((prev) => ({ ...prev, loading: false, error: formatted }));
      throw error;
    }
  }, []);

  return {
    ...state,
    listPackages,
    getCurrentSubscription,
    createSubscription,
    upgradeSubscription,
    cancelSubscription,
    createCheckoutSession,
  };
}
