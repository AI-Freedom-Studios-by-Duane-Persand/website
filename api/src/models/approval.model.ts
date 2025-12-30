import { Schema, Document, Types } from 'mongoose';

export type ApprovalType = 'strategy' | 'content' | 'schedule' | 'ads';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'needs_review';

export interface ApprovalDocument extends Document {
  tenantId: Types.ObjectId;
  campaignId: Types.ObjectId;
  type: ApprovalType;
  status: ApprovalStatus;
  version: number; // Strategy/content/schedule version being approved
  requiredApprovals: number; // How many approvals needed before publishing
  currentApprovals: number; // How many have approved
  approvers: Array<{
    userId: string;
    role: string;
    approved: boolean;
    approvedAt?: Date;
    feedback?: string;
  }>;
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedAt?: Date;
  createdAt: Date;
  createdBy: string;
  invalidatedAt?: Date;
  invalidatedBy?: string;
  invalidationReason?: string; // e.g., "Strategy changed - needs re-review"
  publishedAt?: Date;
  publishedBy?: string;
  metadata?: Record<string, any>;
}

export const ApprovalSchema = new Schema<ApprovalDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  type: { type: String, enum: ['strategy', 'content', 'schedule', 'ads'], required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'needs_review'], default: 'pending' },
  version: { type: Number, required: true },
  requiredApprovals: { type: Number, default: 1 },
  currentApprovals: { type: Number, default: 0 },
  approvers: [{
    userId: { type: String, required: true },
    role: { type: String },
    approved: { type: Boolean, default: false },
    approvedAt: { type: Date },
    feedback: { type: String }
  }],
  rejectionReason: { type: String },
  rejectedBy: { type: String },
  rejectedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true },
  invalidatedAt: { type: Date },
  invalidatedBy: { type: String },
  invalidationReason: { type: String },
  publishedAt: { type: Date },
  publishedBy: { type: String },
  metadata: { type: Object, default: {} }
});

// Indexes for efficient querying
ApprovalSchema.index({ tenantId: 1, campaignId: 1, type: 1 });
ApprovalSchema.index({ campaignId: 1, status: 1 });
ApprovalSchema.index({ campaignId: 1, type: 1, version: 1 });
ApprovalSchema.index({ 'approvers.userId': 1, status: 1 });
