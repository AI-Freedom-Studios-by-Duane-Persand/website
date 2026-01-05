// shared/types.ts
// Shared TypeScript interfaces for all MongoDB collections

import { Types } from 'mongoose';

// Tenant and User
export interface Tenant {
  _id: Types.ObjectId;
  name: string;
  planId: string | null;
  stripeCustomerId: string | null;
  subscriptionStatus: 'active' | 'expired' | 'pending' | 'none';
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  email: string;
  passwordHash: string;
  roles: string[];
  isEarlyAccess?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Subscription
export interface Subscription {
  _id?: string;
  userId: string;
  packageId: string;
  status: 'active' | 'pending' | 'cancelled' | 'expired';
  stripeSessionId?: string;
  paymentLink?: string;
  validUntil?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Brand Profile
export interface BrandProfile {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  name: string;
  voiceGuidelines: string;
  targetAudiences: string[];
  brandAssets: {
    logos: string[];
    primaryColor?: string;
    secondaryColor?: string;
    fonts?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Campaign
export interface Campaign {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  name: string;
  status: string;
  statusHistory: Array<{
    status: string;
    changedAt: Date;
    changedBy: string;
    note?: string;
  }>;
  strategyVersions: Array<{
    version: number;
    createdAt: Date;
    createdBy: string;
    platforms: string[];
    goals: string[];
    targetAudience: string;
    contentPillars: string[];
    brandTone: string;
    constraints?: string;
    cadence: string;
    adsConfig?: any;
    invalidated: boolean;
    invalidatedAt?: Date;
    invalidatedBy?: string;
  }>;
  contentVersions: Array<{
    version: number;
    createdAt: Date;
    createdBy: string;
    mode: 'ai' | 'manual' | 'hybrid';
    textAssets: string[];
    imageAssets: string[];
    videoAssets: string[];
    aiModel?: string;
    regenerationMeta?: any;
    strategyVersion: number;
    needsReview: boolean;
    invalidated: boolean;
    invalidatedAt?: Date;
    invalidatedBy?: string;
  }>;
  assetRefs: Array<{
    url: string;
    type: 'image' | 'video' | 'text' | 'other';
    tags?: string[];
    uploadedAt: Date;
    uploadedBy: string;
    usedInContentVersions?: number[];
    usedInStrategyVersions?: number[];
    replacedBy?: string;
  }>;
  schedule: Array<{
    slot: Date;
    locked: boolean;
    contentVersion: number;
    platform: string;
    conflict: boolean;
    conflictReason?: string;
    regenerated: boolean;
    regeneratedAt?: Date;
    regeneratedBy?: string;
  }>;
  approvalStates: Record<string, string>;
  revisionHistory: Array<{
    revision: number;
    changedAt: Date;
    changedBy: string;
    changes: any;
    note?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Campaign Brief
export interface CampaignBrief {
  _id: Types.ObjectId;
  campaignId: Types.ObjectId;
  rawInput: {
    productDescription: string;
    targetAudience: string;
    mainOffer: string;
    positioning: string;
    competitors?: string;
    links?: string[];
  };
  processedInsights: {
    personaSummary: string;
    keyBenefits: string[];
    keyPains: string[];
    objections: string[];
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

// Angle
export interface Angle {
  _id: Types.ObjectId;
  campaignId: Types.ObjectId;
  title: string;
  description: string;
  funnelStage: 'TOFU' | 'MOFU' | 'BOFU';
  createdAt: Date;
  updatedAt: Date;
}

// Creative
export interface Creative {
  _id: string;
  campaignId: string | null;
  tenantId: string;
  type: 'text' | 'image' | 'video';
  angleId?: string | null;
  platforms?: string[];
  copy?: {
    headline?: string;
    body?: string;
    cta?: string;
    caption?: string;
  };
  visual?: {
    prompt?: string;
    layoutHint?: string;
    imageUrl?: string;
    thumbnailUrl?: string;
  };
  script?: {
    hook?: string;
    body?: string | string[];
    outro?: string;
    scenes?: Array<{
      description: string;
      durationSeconds?: number;
    }>;
  };
  assets?: {
    imageUrls?: string[];
    videoUrl?: string;
  };
  status?: 'draft' | 'needsReview' | 'approved' | 'scheduled' | 'published';
  metadata?: {
    tags?: string[];
    derivedFrom?: string;
    funnelStage?: 'TOFU' | 'MOFU' | 'BOFU';
  };
  // Legacy fields for backward compatibility
  assetUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Scheduled Item
export interface ScheduledItem {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  creativeId: Types.ObjectId;
  platform: string;
  channelType: 'organic' | 'ad';
  publisher: 'ayrshare' | 'metaDirect';
  scheduledAt: Date;
  status: 'pending' | 'inProgress' | 'published' | 'failed';
  platformPostId?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Metric
export interface Metric {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  campaignId: Types.ObjectId | null;
  creativeId: Types.ObjectId | null;
  platform: string;
  platformObjectId: string;
  date: Date;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  raw: any;
  createdAt: Date;
}

// Experiment
export interface Experiment {
  _id: Types.ObjectId;
  campaignId: Types.ObjectId;
  hypothesis: string;
  creativeIds: Types.ObjectId[];
  status: 'running' | 'completed' | 'paused';
  resultsSummary?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Engine Run
export interface EngineRun {
  _id: string;
  engine: string;
  tenantId: string;
  input: any;
  output: any;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface StrategyEngine {
  runStrategy(input: any): Promise<any>;
}

export interface CopyEngine {
  runCopy(input: any): Promise<any>;
}

// Integration Config
export interface IntegrationConfig {
  _id: Types.ObjectId;
  scope: 'global' | 'tenant';
  tenantId: Types.ObjectId | null;
  service: 'gemini' | 'json2video' | 'ayrshare' | 'r2' | 'stripe' | 'meta';
  config: string;
  createdAt: Date;
  updatedAt: Date;
}

// Plan
export interface Plan {
  planId: string;
  name: string;
  priceCents: number;
  interval: 'monthly' | 'yearly';
  limits: {
    campaigns: number;
    postsPerMonth: number;
    users: number;
  };
}
