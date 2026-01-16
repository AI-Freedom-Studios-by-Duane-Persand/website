import { apiClient } from './client';

export interface DataDeletionRequest {
  email: string;
  reason?: string;
}

export interface DataDeletionResponse {
  message: string;
}

export const dataDeletionApi = {
  requestDeletion: async (payload: DataDeletionRequest) => {
    return apiClient.post<DataDeletionResponse>('/data-deletion/request', payload);
  },
};
