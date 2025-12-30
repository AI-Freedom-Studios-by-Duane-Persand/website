import { Schema, Document, Types } from 'mongoose';

export interface RenderJobDocument extends Document {
  tenantId: Types.ObjectId;
  creativeId: Types.ObjectId;
  campaignId: Types.ObjectId;
  type: 'image' | 'video';
  provider: string; // e.g., 'stable-diffusion', 'runway', 'pika'
  model: string;
  status: 'queued' | 'running' | 'failed' | 'published' | 'cancelled';
  params: {
    prompt?: string;
    negativePrompt?: string;
    width?: number;
    height?: number;
    steps?: number;
    seed?: number;
    guidance?: number;
    duration?: number;
    frameRate?: number;
    quality?: string;
    [key: string]: any;
  };
  providerJobId?: string; // External job ID for async polling
  progress: {
    currentStep?: number;
    totalSteps?: number;
    estimatedTimeRemaining?: number;
    lastUpdated?: Date;
  };
  outputUrls?: {
    primary?: string;
    variants?: string[]; // e.g., square, story, landscape
    posterFrame?: string; // For videos
  };
  error?: {
    code?: string;
    message: string;
    details?: any;
  };
  logs: Array<{
    timestamp: Date;
    level: 'info' | 'warn' | 'error';
    message: string;
  }>;
  metadata: {
    hash?: string; // For deduplication
    inferredFrom?: string; // e.g., creative ID
    aiModel?: string;
    regenerationCount?: number;
    [key: string]: any;
  };
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export const RenderJobSchema = new Schema<RenderJobDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  creativeId: { type: Schema.Types.ObjectId, ref: 'Creative', required: true },
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  type: { type: String, enum: ['image', 'video'], required: true },
  provider: { type: String, required: true },
  model: { type: String, required: true },
  status: { type: String, enum: ['queued', 'running', 'failed', 'published', 'cancelled'], default: 'queued' },
  params: { type: Object, default: {} },
  providerJobId: { type: String },
  progress: {
    currentStep: { type: Number },
    totalSteps: { type: Number },
    estimatedTimeRemaining: { type: Number },
    lastUpdated: { type: Date },
  },
  outputUrls: {
    primary: { type: String },
    variants: [{ type: String }],
    posterFrame: { type: String },
  },
  error: {
    code: { type: String },
    message: { type: String },
    details: { type: Object },
  },
  logs: [{
    timestamp: { type: Date, default: Date.now },
    level: { type: String, enum: ['info', 'warn', 'error'], default: 'info' },
    message: { type: String },
  }],
  metadata: { type: Object, default: {} },
  retryCount: { type: Number, default: 0 },
  maxRetries: { type: Number, default: 3 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  startedAt: { type: Date },
  completedAt: { type: Date },
});

// Indexes for efficient querying
RenderJobSchema.index({ tenantId: 1, creativeId: 1 });
RenderJobSchema.index({ tenantId: 1, status: 1 });
RenderJobSchema.index({ providerJobId: 1 });
RenderJobSchema.index({ createdAt: -1 });
