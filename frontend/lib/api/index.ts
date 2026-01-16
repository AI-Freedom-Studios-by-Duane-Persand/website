/**
 * Frontend API Client & Hooks Barrel Exports
 * Central point for all API and utility imports
 */

// API Clients
export { apiClient, ApiClient, type ApiErrorResponse, type UserJwt } from './client';
export { campaignsApi, type Campaign, type CreateCampaignDto, type UpdateCampaignDto } from './campaigns.api';
export { authApi, type LoginRequest, type AuthResponse } from './auth.api';
export { subscriptionsApi, type SubscriptionDto, type PackageDto } from './subscriptions.api';
export { approvalsApi, type CampaignWithApprovals, type ApprovalState } from './approvals.api';
export { billingApi, type CheckoutResponse } from './billing.api';
export { dataDeletionApi, type DataDeletionRequest, type DataDeletionResponse } from './data-deletion.api';
export { earlyAccessApi, type EarlyAccessRequest, type EarlyAccessResponse } from './early-access.api';
export { adminApi, type Integration, type R2Config as AdminR2Config, type AdminSubscription } from './admin.api';
export { schedulingApi, type ScheduledPost, type CreateScheduledPostRequest } from './scheduling.api';
export { creativesApi, type Creative, type CreateCreativeRequest, type RenderMediaRequest } from './creatives.api';
export { storageApi, type StorageUploadResponse } from './storage.api';

// Error Handling
export {
  parseApiError,
  getUserMessage,
  type ApiErrorResponse as ErrorResponse,
} from '../error-handler';

// Auth Utilities
export { getAuthHeaders } from '../utils/auth-headers';

// React Hooks
export { useCampaigns } from '../hooks/useCampaigns';

export {
  useAuth,
  usePasswordReset,
  type UseAuthState,
} from '../hooks/useAuth';

export {
  useSubscriptions,
  type UseSubscriptionsState,
} from '../hooks/useSubscriptions';
