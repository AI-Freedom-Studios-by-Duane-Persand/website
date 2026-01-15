/**
 * Subscriptions API Client
 * All endpoints related to subscription management and billing
 */
import { apiClient } from './client';

export interface SubscriptionDto {
  _id?: string;
  userId: string;
  packageId: string;
  status: 'active' | 'pending' | 'cancelled' | 'expired';
  stripeSessionId?: string;
  paymentLink?: string;
  validUntil?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PackageDto {
  _id?: string;
  name: string;
  price: number;
  description?: string;
  features?: string[];
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const subscriptionsApi = {
  /**
   * Get available packages
   */
  listPackages: async () => {
    return apiClient.get<PackageDto[]>('/subscriptions/packages');
  },

  /**
   * Get package by ID
   */
  getPackage: async (id: string) => {
    return apiClient.get<PackageDto>(`/subscriptions/packages/${id}`);
  },

  /**
   * Get current user's subscription
   */
  getCurrentSubscription: async () => {
    return apiClient.get<SubscriptionDto>('/subscriptions/current');
  },

  /**
   * Get subscription by ID
   */
  getSubscription: async (id: string) => {
    return apiClient.get<SubscriptionDto>(`/subscriptions/${id}`);
  },

  /**
   * Create subscription
   */
  create: async (packageId: string) => {
    return apiClient.post('/subscriptions', { packageId });
  },

  /**
   * Upgrade subscription
   */
  upgrade: async (subscriptionId: string, packageId: string) => {
    return apiClient.put(`/subscriptions/${subscriptionId}`, { packageId });
  },

  /**
   * Cancel subscription
   */
  cancel: async (subscriptionId: string) => {
    return apiClient.post(`/subscriptions/${subscriptionId}/cancel`, {});
  },

  /**
   * Get subscription history
   */
  getHistory: async () => {
    return apiClient.get<SubscriptionDto[]>('/subscriptions/history');
  },

  /**
   * Create checkout session
   */
  createCheckoutSession: async (packageId: string) => {
    return apiClient.post<{ sessionId: string; url: string }>(
      '/subscriptions/checkout',
      { packageId }
    );
  },
};
