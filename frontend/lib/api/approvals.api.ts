import { apiClient } from './client';
import type { Campaign } from './campaigns.api';

export interface ApprovalState {
  scope: 'strategy' | 'content' | 'schedule' | 'ads';
  status: 'pending' | 'approved' | 'rejected' | 'needs_review';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  invalidatedAt?: string;
  invalidationReason?: string;
}

export type CampaignWithApprovals = Campaign & {
  approvalStates?: Record<string, ApprovalState>;
};

export const approvalsApi = {
  listCampaigns: async (query?: Record<string, any>) => {
    return apiClient.get<CampaignWithApprovals[]>(`/campaigns${query ? `?${new URLSearchParams(query).toString()}` : ''}`);
  },

  approve: async (campaignId: string, scope: string, approvedBy?: string) => {
    return apiClient.post(`/approvals/${campaignId}/approve`, { scope, approvedBy });
  },

  reject: async (campaignId: string, scope: string, reason: string, rejectedBy?: string) => {
    return apiClient.post(`/approvals/${campaignId}/reject`, { scope, rejectedBy, reason });
  },
};
