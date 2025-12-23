
import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Campaign extends Document {
  @Prop({ required: true })
  tenantId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  status!: string; // draft, review, approved, published, needs_review, etc.

  @Prop({ default: [] })
  statusHistory!: Array<{
    status: string;
    changedAt: Date;
    changedBy: string;
    note?: string;
  }>;

  @Prop({ default: [] })
  strategyVersions!: Array<{
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

  @Prop({ default: [] })
  contentVersions!: Array<{
    version: number;
    createdAt: Date;
    createdBy: string;
    mode: 'ai' | 'manual' | 'hybrid';
    textAssets: string[]; // R2 URLs
    imageAssets: string[]; // R2 URLs
    videoAssets: string[]; // R2 URLs
    aiModel?: string;
    regenerationMeta?: any;
    strategyVersion: number;
    needsReview: boolean;
    invalidated: boolean;
    invalidatedAt?: Date;
    invalidatedBy?: string;
  }>;

  @Prop({ default: [] })
  assetRefs!: Array<{
    url: string;
    type: 'image' | 'video' | 'text' | 'other';
    tags?: string[];
    uploadedAt: Date;
    uploadedBy: string;
    usedInContentVersions?: number[];
    usedInStrategyVersions?: number[];
    replacedBy?: string;
  }>;

  @Prop({ default: [] })
  schedule!: Array<{
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

  @Prop(raw({
    strategy: { type: String, enum: ['pending', 'approved', 'needs_review'], default: 'pending' },
    content: { type: String, enum: ['pending', 'approved', 'needs_review'], default: 'pending' },
    schedule: { type: String, enum: ['pending', 'approved', 'needs_review'], default: 'pending' },
    ads: { type: String, enum: ['pending', 'approved', 'needs_review'], default: 'pending' },
  }))
  approvalStates!: Record<string, string>;

  @Prop({ default: [] })
  revisionHistory!: Array<{
    revision: number;
    changedAt: Date;
    changedBy: string;
    changes: any;
    note?: string;
  }>;
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);