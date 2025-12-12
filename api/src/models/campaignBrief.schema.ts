// api/src/models/campaignBrief.schema.ts
import { Schema, Document, model, Types } from 'mongoose';

export interface CampaignBriefDocument extends Document {
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

const CampaignBriefSchema = new Schema<CampaignBriefDocument>({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  rawInput: {
    productDescription: { type: String, required: true },
    targetAudience: { type: String, required: true },
    mainOffer: { type: String, required: true },
    positioning: { type: String, required: true },
    competitors: { type: String },
    links: [{ type: String }],
  },
  processedInsights: {
    personaSummary: { type: String },
    keyBenefits: [{ type: String }],
    keyPains: [{ type: String }],
    objections: [{ type: String }],
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const CampaignBriefModel = model<CampaignBriefDocument>('CampaignBrief', CampaignBriefSchema);
