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
}

export interface ImprovePromptResponse {
  improved_prompt?: string;
  improvedPrompt?: string;
}

export interface RegenerateRequest {
  model?: string;
  prompt?: string;
  scope?: string;
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
  
  improvePrompt: (payload: ImprovePromptRequest) =>
    apiClient.post<ImprovePromptResponse>('/poe/improve-prompt', payload),
};
