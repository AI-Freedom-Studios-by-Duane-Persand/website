import { apiClient } from './client';

export interface Integration {
  _id: string;
  service: string;
  scope?: string;
  config?: any;
}

export interface R2Config {
  bucketName: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
  region: string;
}

export interface TenantOption { label: string; value: string; }
export interface PlanOption { label: string; value: string; }

export interface AdminSubscription {
  _id: string;
  tenantId: string;
  planId: string;
  status: string;
  billingInterval?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  amountPaid?: number;
}

export interface StorageTestResult {
  bucketName?: string;
  accessible?: boolean;
}

export interface RefreshCreativeImageUrlsResult {
  total: number;
  updated: number;
  errors: number;
}

export const adminApi = {
  // Integrations
  listIntegrations: () => apiClient.get<Integration[]>('/admin/integrations'),
  updateIntegrationConfig: (id: string, config: string) =>
    apiClient.post(`/admin/integrations/${id}/config`, { config }),
  createIntegration: (payload: { service: string; scope: string; config: string }) =>
    apiClient.post('/admin/integrations', payload),
  deleteIntegration: (id: string) => apiClient.delete(`/admin/integrations/${id}`),

  // R2 config (shared with integrations page)
  getR2Config: () => apiClient.get<Record<string, any>>('/admin/r2-config'),
  updateR2Config: (payload: Record<string, any>) => apiClient.post('/admin/r2-config', payload),

  // Branding
  getBrandingConfig: () => apiClient.get<{ logoUrl?: string; faviconUrl?: string }>('/admin/branding/config'),
  uploadBranding: (form: FormData) => apiClient.post('/admin/branding/upload', form),

  // Storage
  getStorageConfig: () => apiClient.get<R2Config>('/admin/storage/config'),
  saveStorageConfig: (payload: Partial<R2Config>) => apiClient.post<R2Config>('/admin/storage/config', payload),
  testStorage: (payload: Partial<R2Config>) => apiClient.post<StorageTestResult>('/admin/storage/test', payload),
  refreshCreativeImageUrls: () => apiClient.post<RefreshCreativeImageUrlsResult>('/admin/storage/refresh-creative-image-urls', {}),

  // Tenants
  listTenants: () => apiClient.get<any[]>('/admin/tenants'),
  overrideTenant: (id: string, payload: { planId: string; subscriptionStatus: string }) =>
    apiClient.post(`/admin/tenants/${id}/override`, payload),
  deleteTenant: (id: string) => apiClient.delete(`/admin/tenants/${id}`),

  // Users
  listUsers: () => apiClient.get<any[]>('/admin/users'),
  updateUserRoles: (userId: string, roles: string[]) =>
    apiClient.patch(`/admin/users/${userId}/roles`, { roles }),

  // Subscriptions (admin)
  listTenantOptions: () => apiClient.get<TenantOption[]>('/tenants/ids-names'),
  listPlanOptions: () => apiClient.get<PlanOption[]>('/admin/packages/ids-names'),
  listAdminSubscriptions: () => apiClient.get<AdminSubscription[]>('/admin/subscriptions'),
  getSubscription: (id: string) => apiClient.get<AdminSubscription>(`/admin/subscriptions/${id}`),
  updateSubscription: (id: string, payload: Partial<AdminSubscription>) =>
    apiClient.put(`/admin/subscriptions/${id}`, payload),
  deleteSubscription: (id: string) => apiClient.delete(`/admin/subscriptions/${id}`),
  createSubscription: (payload: Partial<AdminSubscription>) => apiClient.post('/admin/subscriptions', payload),
};
