import { apiClient } from './client';

export interface Creative {
  _id: string;
  type: 'text' | 'image' | 'video';
  status: string;
  copy?: {
    caption?: string;
    hashtags?: string[];
  };
  visual?: {
    imageUrl?: string;
    prompt?: string;
  };
  assets?: {
    videoUrl?: string;
  };
  script?: {
    hook?: string;
    body?: string | string[];
    outro?: string;
  };
  metadata?: {
    prompt?: string;
  };
  tenantId?: string;
  campaignId?: string;
  updatedAt: string;
  createdAt?: string;
}

export interface CreateCreativeRequest {
  type: 'text' | 'image' | 'video';
  tenantId: string;
  status?: string;
  campaignId?: string;
  copy?: {
    caption?: string;
    hashtags?: string[];
  };
  visual?: {
    prompt?: string;
  };
  script?: {
    hook?: string;
    body?: string;
  };
  durationSeconds?: number;
  generateNow?: boolean;
  selectedModel?: string;
}

export interface RenderMediaRequest {
  model?: string;
  width?: number;
  height?: number;
  negativePrompt?: string;
  numInferenceSteps?: number;
  guidanceScale?: number;
  scheduler?: string;
  durationSeconds?: number;
  fps?: number;
}

export interface ImprovePromptRequest {
  prompt: string;
  context?: string;
  content_type?: 'text' | 'image' | 'video';
}

export interface ImprovePromptResponse {
  success?: boolean;
  data?: {
    content: string;
    model: string;
    tokens_used?: number;
    timestamp?: string;
  };
  // Fallback for legacy format
  content?: string;
  improved_prompt?: string;
  improvedPrompt?: string;
}

export interface RegenerateRequest {
  model?: string;
  prompt?: string;
  scope?: string;
}

export interface V1TextGenerationRequest {
  prompt: string;
  model?: string;
  system_prompt_type?: string;
  tenant_id: string;
  max_tokens?: number;
  temperature?: number;
}

export interface V1ImageGenerationRequest {
  prompt: string;
  model?: string;
  tenant_id: string;
  resolution?: string;
  style?: string;
}

export interface V1VideoGenerationRequest {
  prompt: string;
  model?: string;
  tenant_id: string;
  duration_seconds?: number;
  aspect_ratio?: string;
}

export const creativesApi = {
  list: () => apiClient.get<Creative[]>('/creatives'),
  
  create: (payload: CreateCreativeRequest) =>
    apiClient.post<Creative>('/creatives', payload),
  
  editCaption: (id: string, caption: string) =>
    apiClient.put(`/creatives/${id}/edit-caption`, { caption }),
  
  editPrompt: (id: string, prompt: string) =>
    apiClient.put(`/creatives/${id}/edit-prompt`, { prompt }),
  
  render: (id: string, payload: RenderMediaRequest) =>
    apiClient.post(`/creatives/${id}/render`, payload),
  
  regenerate: (id: string, payload: RegenerateRequest) =>
    apiClient.put(`/creatives/${id}/regenerate`, payload),
  
  // V1 Content Service endpoints
  improvePrompt: (payload: ImprovePromptRequest) => {
    // Get token directly from localStorage to ensure we have the latest
    const token = typeof window !== 'undefined' 
      ? (localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('auth_token'))
      : null;
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Parse JWT to get tenantId
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const parsed = JSON.parse(jsonPayload);
      const tenantId = parsed.tenantId || parsed.tenant_id;
      
      if (!tenantId) {
        throw new Error('No tenantId found in token');
      }
      
      return apiClient.post<ImprovePromptResponse>('/v1/content/generate/text', {
        prompt: payload.prompt,
        model: 'gpt-4o',
        system_prompt_type: 'prompt-improver',
        tenant_id: tenantId,
        context: payload.context,
      });
    } catch (error) {
      console.error('Failed to parse token:', error);
      throw new Error('Invalid authentication token');
    }
  },
  
  generateText: (payload: V1TextGenerationRequest) =>
    apiClient.post('/v1/content/generate/text', payload),
  
  generateImage: (payload: V1ImageGenerationRequest) =>
    apiClient.post('/v1/content/generate/image', payload),
  
  generateVideo: (payload: V1VideoGenerationRequest) =>
    apiClient.post('/v1/content/generate/video', payload),
  
  getJobStatus: (jobId: string) =>
    apiClient.get(`/v1/content/jobs/${jobId}`),
};
