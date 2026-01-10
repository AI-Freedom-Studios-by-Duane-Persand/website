import { Schema, Document, Types } from 'mongoose';

/**
 * Social Account Schema for storing connected Meta (Facebook/Instagram) accounts
 * Stores encrypted access tokens and manages token refresh
 */

export interface SocialAccount {
  userId: Types.ObjectId;
  tenantId: Types.ObjectId;
  platform: 'facebook' | 'instagram';
  
  // Meta Account Info
  metaUserId?: string; // Facebook User ID
  pageId?: string; // Facebook Page ID (required for Instagram)
  pageName?: string;
  instagramAccountId?: string; // Instagram Business Account ID
  instagramUsername?: string;
  
  // Encrypted Tokens (use crypto to encrypt/decrypt)
  encryptedAccessToken: string; // Encrypted access token
  encryptedRefreshToken?: string; // For future use if Meta supports refresh tokens
  
  // Token Metadata
  tokenExpiresAt?: Date; // When token expires (null for Page tokens)
  tokenType: 'user' | 'page'; // User token or Page token
  scopes: string[]; // Granted permissions
  
  // Status
  isActive?: boolean;
  lastSyncedAt?: Date; // Last time we verified token is valid
  lastUsedAt?: Date; // Last time used for posting
  
  // Error Tracking
  lastError?: string;
  errorCount?: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialAccountDocument extends SocialAccount, Document {}

export const SocialAccountSchema = new Schema<SocialAccountDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  platform: { type: String, enum: ['facebook', 'instagram'], required: true },
  
  // Meta Account Info
  metaUserId: { type: String },
  pageId: { type: String },
  pageName: { type: String },
  instagramAccountId: { type: String },
  instagramUsername: { type: String },
  
  // Encrypted Tokens
  encryptedAccessToken: { type: String, required: true },
  encryptedRefreshToken: { type: String },
  
  // Token Metadata
  tokenExpiresAt: { type: Date },
  tokenType: { type: String, enum: ['user', 'page'], required: true },
  scopes: [{ type: String }],
  
  // Status
  isActive: { type: Boolean, default: true },
  lastSyncedAt: { type: Date },
  lastUsedAt: { type: Date },
  
  // Error Tracking
  lastError: { type: String },
  errorCount: { type: Number, default: 0 },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes for efficient queries
SocialAccountSchema.index({ userId: 1, tenantId: 1 });
SocialAccountSchema.index({ userId: 1, platform: 1 });
SocialAccountSchema.index({ pageId: 1 });
SocialAccountSchema.index({ instagramAccountId: 1 });
SocialAccountSchema.index({ tokenExpiresAt: 1 });
SocialAccountSchema.index({ isActive: 1, tokenExpiresAt: 1 }); // For token refresh queries

// Update timestamp on save
SocialAccountSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});
