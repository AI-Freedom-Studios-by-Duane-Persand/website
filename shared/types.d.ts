import { Types } from 'mongoose';
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
    createdAt: Date;
    updatedAt: Date;
}
export interface Subscription {
    _id: Types.ObjectId;
    tenantId: Types.ObjectId;
    planId: string;
    status: 'pending' | 'active' | 'expired' | 'canceled';
    billingInterval: 'monthly' | 'yearly';
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    lastStripePaymentId: string | null;
    amountPaid: number | null;
    currency: string | null;
    pendingCheckoutSessionId: string | null;
    createdAt: Date;
    updatedAt: Date;
}
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
export interface Campaign {
    _id: Types.ObjectId;
    tenantId: Types.ObjectId;
    name: string;
    objective: 'awareness' | 'traffic' | 'leads' | 'sales';
    budget: number | null;
    startDate: Date | null;
    endDate: Date | null;
    status: 'draft' | 'active' | 'completed';
    createdAt: Date;
    updatedAt: Date;
}
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
export interface Angle {
    _id: Types.ObjectId;
    campaignId: Types.ObjectId;
    title: string;
    description: string;
    funnelStage: 'TOFU' | 'MOFU' | 'BOFU';
    createdAt: Date;
    updatedAt: Date;
}
export interface Creative {
    _id: Types.ObjectId;
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
        body?: string | string[];
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
export interface EngineRun {
    _id: Types.ObjectId;
    tenantId: Types.ObjectId | null;
    campaignId: Types.ObjectId | null;
    engineName: string;
    version: string;
    input: any;
    output: any;
    score?: number;
    createdAt: Date;
}
export interface IntegrationConfig {
    _id: Types.ObjectId;
    scope: 'global' | 'tenant';
    tenantId: Types.ObjectId | null;
    service: 'gemini' | 'json2video' | 'ayrshare' | 'r2' | 'stripe' | 'meta';
    config: string;
    createdAt: Date;
    updatedAt: Date;
}
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
//# sourceMappingURL=types.d.ts.map