import { apiClient } from './client';

export interface EarlyAccessRequest {
  email: string;
}

export interface EarlyAccessResponse {
  message?: string;
}

export const earlyAccessApi = {
  requestAccess: async (email: string) => {
    return apiClient.post<EarlyAccessResponse>('/early-access/request', { email });
  },
};
