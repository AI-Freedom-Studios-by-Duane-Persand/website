/**
 * Frontend API Client & Hooks Barrel Exports
 * Central point for all API and utility imports
 */

// API Clients
export { apiClient, ApiClient, type ApiErrorResponse, type UserJwt } from './client';
export { campaignsApi, type Campaign, type CreateCampaignDto, type UpdateCampaignDto } from './campaigns.api';
export { authApi, type LoginRequest, type AuthResponse } from './auth.api';
export { subscriptionsApi, type SubscriptionDto, type PackageDto } from './subscriptions.api';

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
