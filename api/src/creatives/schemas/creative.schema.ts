// api/src/creatives/schemas/creative.schema.ts
import { Schema, Document, Types } from 'mongoose';

export interface CreativeDocument extends Document {
  campaignId: Types.ObjectId;
  tenantId: Types.ObjectId;
  type: 'text' | 'image' | 'video';
  angleId: Types.ObjectId | null;
  platforms: string[];
  copy: {
    headline?: string;
    body?: string;
    cta?: string;
    caption?: string;
  };
  visual: {
    prompt?: string;
    layoutHint?: string;
    imageUrl?: string;
    thumbnailUrl?: string;
  };
  script: {
    hook?: string;
    body?: string;
    outro?: string;
    scenes?: Array<{
      description: string;
      durationSeconds?: number;
    }>;
  };
  assets: {
    imageUrls?: string[];
    videoUrl?: string;
  };
  status: 'draft' | 'needsReview' | 'approved' | 'scheduled' | 'published';
  metadata: {
    tags?: string[];
    derivedFrom?: string;
    funnelStage?: 'TOFU' | 'MOFU' | 'BOFU';
  };
  createdAt: Date;
  updatedAt: Date;
}

export const CreativeSchema = new Schema<CreativeDocument>({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  type: { type: String, enum: ['text', 'image', 'video'], required: true },
  angleId: { type: Schema.Types.ObjectId, ref: 'Angle', default: null },
  platforms: [{ type: String, required: true }],
  copy: {
    headline: { type: String },
    body: { type: String },
    cta: { type: String },
    caption: { type: String },
  },
  visual: {
    prompt: { type: String },
    layoutHint: { type: String },
    imageUrl: { type: String },
    thumbnailUrl: { type: String },
  },
  script: {
    hook: { type: String },
    body: { type: String },
    outro: { type: String },
    scenes: [{
      description: { type: String },
      durationSeconds: { type: Number },
    }],
  },
  assets: {
    imageUrls: [{ type: String }],
    videoUrl: { type: String },
  },
  status: { type: String, enum: ['draft', 'needsReview', 'approved', 'scheduled', 'published'], default: 'draft' },
  metadata: {
    tags: [{ type: String }],
    derivedFrom: { type: String },
    funnelStage: { type: String, enum: ['TOFU', 'MOFU', 'BOFU'] },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Do not export a compiled model here. Use MongooseModule.forFeature in modules.
