// api/src/models/campaign.schema.ts
import { Schema, Document, Types } from 'mongoose';

export interface CampaignDocument extends Document {
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
  approvalStates: Record<string, any>;
  revisionHistory: Array<{
    revision: number;
    changedAt: Date;
    changedBy: string;
    changes: any;
    note?: string;
  }>;
  metadata?: {
    promptResponses?: Array<{
      promptId: string;
      response: 'skip' | 'accept' | 'provide' | 'later';
      value?: any;
      respondedAt: Date;
    }>;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

export const CampaignSchema = new Schema<CampaignDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  name: { type: String, required: true },
  status: { type: String, default: 'draft' },
  statusHistory: { type: [Object], default: [] },
  strategyVersions: { type: [Object], default: [] },
  contentVersions: { type: [Object], default: [] },
  assetRefs: { type: [Object], default: [] },
  schedule: { type: [Object], default: [] },
  approvalStates: { type: Object, default: {} },
  revisionHistory: { type: [Object], default: [] },
  metadata: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Do not export a compiled model here. Use MongooseModule.forFeature in modules.
