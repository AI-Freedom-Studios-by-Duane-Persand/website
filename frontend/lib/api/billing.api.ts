import { apiClient } from './client';

export interface CheckoutResponse {
  url: string;
}

export const billingApi = {
  createCheckoutSession: async (planId: string) => {
    return apiClient.post<CheckoutResponse>('/billing/checkout', { planId });
  },
};
