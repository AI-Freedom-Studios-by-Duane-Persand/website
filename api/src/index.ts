/**
 * Root Barrel Export for AI Freedom Studios API
 * 
 * This file provides centralized exports from all feature modules,
 * enabling clean imports like: import { CampaignsService, CampaignDto } from '@app/api'
 * 
 * Module exports follow the pattern:
 * - Module class (e.g., CampaignsModule)
 * - Services (e.g., CampaignsService, CampaignChatService)
 * - DTOs (e.g., CampaignDto, CreateCampaignDto, UpdateCampaignDto)
 * - Database entities (e.g., Campaign document, schema)
 * - Types and enums
 */

// ============================================================================
// CAMPAIGNS MODULE
// ============================================================================
export * from './campaigns';

// ============================================================================
// USERS MODULE
// ============================================================================
export * from './users';

// ============================================================================
// AUTH MODULE
// ============================================================================
export * from './auth';

// ============================================================================
// SUBSCRIPTIONS MODULE
// ============================================================================
export * from './subscriptions';

// ============================================================================
// CREATIVES MODULE
// ============================================================================
export * from './creatives';

// ============================================================================
// TENANTS MODULE
// ============================================================================
export * from './tenants';

// ============================================================================
// APPROVALS MODULE
// ============================================================================
export * from './approvals';

// ============================================================================
// META ADS MODULE
// ============================================================================
export * from './meta-ads';

// ============================================================================
// STORAGE (ASSETS) MODULE
// ============================================================================
export * from './storage';

// ============================================================================
// BILLING (PACKAGES) MODULE
// ============================================================================
export * from './billing';

// ============================================================================
// COMMON / SHARED INFRASTRUCTURE
// ============================================================================
// Export common services, decorators, and utilities that are used across modules
export * from './common/decorators';
export * from './common/filters';
export * from './common/guards';
export * from './common/interceptors';
export * from './common/middleware';

// ============================================================================
// ENGINES MODULE (AI & Content Generation)
// ============================================================================
export * from './engines';

// ============================================================================
// CLIENT MODULES
// ============================================================================
export * from './clients/poe.client';
export * from './clients/replicate.client';
export * from './clients/ayrshare.client';
export * from './clients/meta-graph.client';

// ============================================================================
// UTILITIES
// ============================================================================
export * from './utils/logger';
export * from './utils/validation';
export * from './utils/transformers';
