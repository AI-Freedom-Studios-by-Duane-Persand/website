/**
 * Frontend API Client & Hooks Barrel Exports
 * Central point for all API and utility imports
 */

// API Clients
export { apiClient, ApiClient, type ApiErrorResponse, type ApiResponse, type UserJwt } from './client';
export { campaignsApi, type CreateCampaignDto, type UpdateCampaignDto } from './campaigns.api';
export { authApi, type SignupRequest, type LoginRequest, type AuthResponse } from './auth.api';
export { subscriptionsApi, type SubscriptionDto, type PackageDto } from './subscriptions.api';

// Error Handling
export {
  parseApiError,
  logError,
  showErrorToast,
  showSuccessToast,
  showWarningToast,
  getFieldError,
  handleFormError,
  retryWithBackoff,
  type FormattedError,
  type FormError,
} from '../error-handler';

// Auth Utilities
export {
  getAuthHeaders,
  isAuthenticated,
  getCurrentUser,
  setAuthToken,
  clearAuthToken,
  getBearerToken,
} from '../utils/auth-headers';

// React Hooks
export {
  useCampaigns,
  useCampaign,
  useCampaignStrategies,
  useCampaignApprovals,
  type UseCampaignsState,
  type UseCampaign,
} from '../hooks/useCampaigns';

export {
  useAuth,
  usePasswordReset,
  type UseAuthState,
} from '../hooks/useAuth';

export {
  useSubscriptions,
  type UseSubscriptionsState,
} from '../hooks/useSubscriptions';
