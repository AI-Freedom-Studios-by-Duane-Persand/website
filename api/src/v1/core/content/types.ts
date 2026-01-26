/**
 * V1 Content Generation Types
 * 
 * Type definitions for AI Content Service microservice integration.
 * These types match the Python FastAPI service contracts defined in ai-content-service/.
 */

// ============================================================================
// Text Generation Types
// ============================================================================

export type SystemPromptType =
  | 'creative-copy'
  | 'social-post'
  | 'ad-script'
  | 'campaign-strategy'
  | 'prompt-improver';

export interface TextGenerationRequest {
  prompt: string;
  tenant_id: string;
  model?: string;
  system_prompt_type?: SystemPromptType;
  max_tokens?: number;
  temperature?: number;
}

export interface TextGenerationResponse {
  content: string;
  model: string;
  tenant_id: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finish_reason?: string;
}

// ============================================================================
// Image Generation Types
// ============================================================================

export type ImageSize = '1024x1024' | '1792x1024' | '1024x1792';

export interface ImageGenerationRequest {
  prompt: string;
  tenant_id: string;
  model?: string;
  size?: ImageSize;
  resolution?: string; // Legacy field for backward compatibility
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
}

export interface ImageGenerationResponse {
  url: string;
  revised_prompt?: string;
  model: string;
  tenant_id: string;
  storage_path?: string; // Added by NestJS after storing to R2
}

// ============================================================================
// Video Generation Types
// ============================================================================

export type VideoModel = 'sora-2' | 'veo-3.1' | 'runway-gen3';

export interface VideoGenerationRequest {
  prompt: string;
  tenant_id: string;
  model: VideoModel;
  duration?: number;
  duration_seconds?: number; // Alternative field name
  aspect_ratio?: string;
  reference_images?: string[];
  callback_url?: string;
  webhook_url?: string; // Alternative field name
}

export interface VideoGenerationResponse {
  job_id: string;
  status: 'pending' | 'processing';
  tenant_id: string;
  model: VideoModel;
  estimated_time_seconds?: number;
}

// ============================================================================
// Job Status Types
// ============================================================================

export interface JobStatusResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  tenant_id: string;
  progress?: number;
  result?: {
    url: string;
    duration?: number;
    model?: string;
  };
  error?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// ============================================================================
// Metadata and Callback Types
// ============================================================================

export interface ContentGenerationMetadata {
  jobId?: string;
  model: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  prompt: string;
  tenantId: string;
  createdAt: Date;
  completedAt?: Date;
  result?: {
    url?: string;
    content?: string;
  };
  error?: string;
}

export interface VideoCallbackPayload {
  job_id: string;
  status: 'completed' | 'failed';
  tenant_id: string;
  result?: {
    url: string;
    duration?: number;
    model?: string;
  };
  error?: string;
}
