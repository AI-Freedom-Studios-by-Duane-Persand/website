import { apiClient } from './client';

export interface ScheduledPost {
  _id: string;
  content: string;
  assetUrl?: string;
  scheduledAt: string;
}

export interface CreateScheduledPostRequest {
  content: string;
  assetUrl?: string;
  scheduledAt: string;
}

export const schedulingApi = {
  list: async () => apiClient.get<ScheduledPost[]>('/scheduling'),
  create: async (payload: CreateScheduledPostRequest) =>
    apiClient.post<ScheduledPost>('/scheduling', payload),
};
