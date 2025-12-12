// TypeScript interfaces for core collections

export interface Tenant {
  _id: string;
  name: string;
  domain: string;
  ownerUserId: string;
  subscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  _id: string;
  email: string;
  passwordHash: string;
  tenantId: string;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  _id: string;
  tenantId: string;
  plan: string;
  status: 'active' | 'inactive' | 'canceled';
  stripeSessionId?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  _id: string;
  tenantId: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'completed';
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Creative {
  _id: string;
  campaignId: string;
  tenantId: string;
  type: 'image' | 'video' | 'text';
  assetUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
