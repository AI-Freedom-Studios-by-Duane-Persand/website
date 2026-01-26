import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import {
  TextGenerationRequest,
  TextGenerationResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
  VideoGenerationRequest,
  VideoGenerationResponse,
  JobStatusResponse,
} from './types';

/**
 * AIContentServiceClient
 * 
 * HTTP client for connecting NestJS application to the Python-based AI Content Service microservice.
 * Handles all communication with /v1/ endpoints including text, image, and video generation.
 * 
 * Features:
 * - Automatic retry logic with exponential backoff
 * - Tenant ID validation and propagation
 * - Error handling and logging
 * - Job status polling for async operations
 */
@Injectable()
export class AIContentServiceClient {
  private readonly logger = new Logger(AIContentServiceClient.name);
  private readonly baseUrl: string;
  private readonly timeout: number = 30000; // 30 seconds
  private readonly maxRetries: number = 3;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.AI_CONTENT_SERVICE_URL || 'http://localhost:8000';
    this.logger.log(`Initialized AIContentServiceClient with baseUrl: ${this.baseUrl}`);
  }

  /**
   * Generate text content using the AI Content Service
   * Supports multiple system prompt types: creative-copy, social-post, ad-script, campaign-strategy, prompt-improver
   */
  async generateText(
    request: TextGenerationRequest,
    authToken?: string,
  ): Promise<TextGenerationResponse> {
    this.validateTenantId(request.tenant_id);

    try {
      const response = await this.retryableRequest(
        'post',
        '/v1/generate/text',
        request,
        undefined,
        authToken,
      );
      return response as TextGenerationResponse;
    } catch (error) {
      return this.handleError(error, 'Text generation failed');
    }
  }

  /**
   * Improve/enhance user prompts for better generation results
   * Convenience endpoint that calls text generation with prompt-improver system_prompt_type
   */
  async improvePrompt(
    prompt: string,
    tenantId: string,
    authToken?: string,
  ): Promise<TextGenerationResponse> {
    this.validateTenantId(tenantId);

    const request: TextGenerationRequest = {
      prompt,
      tenant_id: tenantId,
      model: 'gpt-4o',
      system_prompt_type: 'prompt-improver',
    };

    try {
      const response = await this.retryableRequest(
        'post',
        '/v1/improve-prompt',
        request,
        undefined,
        authToken,
      );
      return response as TextGenerationResponse;
    } catch (error) {
      return this.handleError(error, 'Prompt improvement failed');
    }
  }

  /**
   * Generate images using DALL-E 3 or other models
   * Supports multiple resolutions: 1024x1024, 1792x1024, 1024x1792
   */
  async generateImage(
    request: ImageGenerationRequest,
    authToken?: string,
  ): Promise<ImageGenerationResponse> {
    this.validateTenantId(request.tenant_id);

    try {
      const response = await this.retryableRequest(
        'post',
        '/v1/generate/image',
        request,
        undefined,
        authToken,
      );
      return response as ImageGenerationResponse;
    } catch (error) {
      return this.handleError(error, 'Image generation failed');
    }
  }

  /**
   * Generate videos asynchronously using Sora-2, Veo-3.1, or Runway models
   * Returns job_id immediately for async polling
   * 
   * Duration validation per model:
   * - Sora-2: 4, 8, or 12 seconds
   * - Veo-3.1: 4, 6, or 8 seconds
   * - Runway: 1-60 seconds
   */
  async generateVideo(
    request: VideoGenerationRequest,
    authToken?: string,
  ): Promise<VideoGenerationResponse> {
    this.validateTenantId(request.tenant_id);

    try {
      const response = await this.retryableRequest(
        'post',
        '/v1/generate/video',
        request,
        undefined,
        authToken,
      );
      return response as VideoGenerationResponse;
    } catch (error) {
      return this.handleError(error, 'Video generation request failed');
    }
  }

  /**
   * Poll job status for asynchronous operations (video generation, etc.)
   * 
   * Response includes:
   * - status: pending, processing, completed, failed
   * - progress: percentage (0-100)
   * - result: generated content URL (on completion)
   * - error: error message (on failure)
   */
  async getJobStatus(jobId: string, tenantId: string, authToken?: string): Promise<JobStatusResponse> {
    this.validateTenantId(tenantId);

    try {
      const response = await this.retryableRequest(
        'get',
        `/v1/jobs/${jobId}`,
        null,
        { tenant_id: tenantId },
        authToken,
      );
      return response as JobStatusResponse;
    } catch (error) {
      return this.handleError(error, `Job status fetch failed for job ${jobId}`);
    }
  }

  /**
   * Check if AI Content Service is healthy and reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.retryableRequest('get', '/health');
      return response?.status === 'ok';
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`Health check failed: ${err.message}`);
      return false;
    }
  }

  /**
   * Retryable HTTP request with exponential backoff
   * Implements retry logic for transient failures
   */
  private async retryableRequest(
    method: 'get' | 'post',
    path: string,
    data?: any,
    params?: Record<string, string>,
    authToken?: string,
  ): Promise<any> {
    let lastError: AxiosError | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const config = {
          timeout: this.timeout,
          params,
          headers: authToken ? { Authorization: authToken } : {},
        };

        const url = `${this.baseUrl}${path}`;

        let response;
        if (method === 'get') {
          response = await firstValueFrom(this.httpService.get(url, config));
        } else {
          response = await firstValueFrom(
            this.httpService.post(url, data, config),
          );
        }

        return response.data;
      } catch (error) {
        lastError = error as AxiosError;
        const statusCode = lastError.response?.status;

        // Don't retry on client errors (4xx)
        if (statusCode && statusCode >= 400 && statusCode < 500) {
          throw error;
        }

        // Exponential backoff for retries
        if (attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          this.logger.debug(
            `Retry attempt ${attempt + 1}/${this.maxRetries} after ${delay}ms`,
          );
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  /**
   * Validate tenant ID is present and valid
   */
  private validateTenantId(tenantId: string): void {
    if (!tenantId || typeof tenantId !== 'string') {
      throw new HttpException(
        'Invalid or missing tenant_id',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Handle errors from AI Content Service with logging
   */
  private handleError(error: any, message: string): never {
    const statusCode = error.response?.status || HttpStatus.SERVICE_UNAVAILABLE;
    const errorMessage = error.response?.data?.detail || error.message || message;

    this.logger.error(`${message}: ${errorMessage}`, error.stack);

    throw new HttpException(
      {
        message: errorMessage,
        statusCode,
      },
      statusCode,
    );
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
