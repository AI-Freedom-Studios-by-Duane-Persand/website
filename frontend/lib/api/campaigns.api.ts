/**
 * Campaigns API Client
 * All endpoints related to campaign management
 */
import { apiClient } from './client';

export interface CreateCampaignDto {
  name: string;
  status?: string;
  tenantId?: string;
  [key: string]: any;
}

export interface UpdateCampaignDto {
  name?: string;
  status?: string;
  [key: string]: any;
}

export const campaignsApi = {
  /**
   * Get all campaigns for current tenant
   */
  list: async (query?: Record<string, any>) => {
    const params = new URLSearchParams(query || {});
    return apiClient.get(`/campaigns?${params.toString()}`);
  },

  /**
   * Get campaign by ID
   */
  getById: async (id: string) => {
    return apiClient.get(`/campaigns/${id}`);
  },

  /**
   * Create new campaign
   */
  create: async (dto: CreateCampaignDto) => {
    return apiClient.post('/campaigns', dto);
  },

  /**
   * Update campaign
   */
  update: async (id: string, dto: UpdateCampaignDto) => {
    return apiClient.put(`/campaigns/${id}`, dto);
  },

  /**
   * Delete campaign
   */
  delete: async (id: string) => {
    return apiClient.delete(`/campaigns/${id}`);
  },

  /**
   * Get campaign strategy versions
   */
  getStrategies: async (campaignId: string) => {
    return apiClient.get(`/campaigns/${campaignId}/strategies`);
  },

  /**
   * Get campaign content versions
   */
  getContentVersions: async (campaignId: string) => {
    return apiClient.get(`/campaigns/${campaignId}/content-versions`);
  },

  /**
   * Get campaign schedule
   */
  getSchedule: async (campaignId: string) => {
    return apiClient.get(`/campaigns/${campaignId}/schedule`);
  },

  /**
   * Get campaign approvals
   */
  getApprovals: async (campaignId: string) => {
    return apiClient.get(`/campaigns/${campaignId}/approvals`);
  },

  /**
   * Publish campaign
   */
  publish: async (campaignId: string) => {
    return apiClient.post(`/campaigns/${campaignId}/publish`, {});
  },

  /**
   * Archive campaign
   */
  archive: async (campaignId: string) => {
    return apiClient.post(`/campaigns/${campaignId}/archive`, {});
  },
};
