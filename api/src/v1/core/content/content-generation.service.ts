import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { AIContentServiceClient } from './ai-content-service.client';
import {
  TextGenerationRequest,
  TextGenerationResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
  VideoGenerationRequest,
  VideoGenerationResponse,
  JobStatusResponse,
  ContentGenerationMetadata,
  VideoCallbackPayload,
} from './types';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { StorageService } from '../../infrastructure/storage/storage.service';

/**
 * ContentGenerationService
 * 
 * High-level orchestration service for all content generation operations.
 * Coordinates between NestJS application, AI Content Service microservice, and storage.
 * 
 * Responsibilities:
 * - Content generation requests via AI Content Service Client
 * - Job status tracking and polling
 * - Result caching and storage
 * - Metadata management
 * - Error handling and fallbacks
 * - Webhook callback handling
 * - Rate limiting and quota enforcement
 */
@Injectable()
export class ContentGenerationService {
  private readonly logger = new Logger(ContentGenerationService.name);

  constructor(
    private readonly aiContentClient: AIContentServiceClient,
    private readonly storageService: StorageService,
    @InjectModel('GenerationJob')
    private readonly generationJobModel: Model<any>,
  ) {}

  /**
   * Generate text content with specified system prompt type
   * 
   * System Prompt Types:
   * - creative-copy: Marketing copy for promotions
   * - social-post: Social media content
   * - ad-script: Direct response advertising scripts
   * - campaign-strategy: Strategic campaign planning
   * - prompt-improver: Enhance weak prompts (internal use)
   */
  async generateText(
    request: TextGenerationRequest,
    userId?: string,
    authToken?: string,
  ): Promise<TextGenerationResponse> {
    this.logger.log(
      `Generating text for tenant ${request.tenant_id} with prompt type: ${request.system_prompt_type}`,
    );

    try {
      // Validate system_prompt_type
      const validPromptTypes = [
        'creative-copy',
        'social-post',
        'ad-script',
        'campaign-strategy',
        'prompt-improver',
      ];
      if (request.system_prompt_type && !validPromptTypes.includes(request.system_prompt_type)) {
        throw new HttpException(
          `Invalid system_prompt_type. Must be one of: ${validPromptTypes.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Call AI Content Service
      const response = await this.aiContentClient.generateText(request, authToken);

      // Store metadata
      await this.storeGenerationMetadata(
        request.tenant_id,
        'text',
        request,
        response,
        userId,
      );

      return response;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Text generation failed: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Improve/enhance a user's prompt for better generation results
   * Uses the prompt-improver system prompt type
   */
  async improvePrompt(
    prompt: string,
    tenantId: string,
    userId?: string,
  ): Promise<TextGenerationResponse> {
    this.logger.log(`Improving prompt for tenant ${tenantId}`);

    try {
      const improvedPrompt = await this.aiContentClient.improvePrompt(
        prompt,
        tenantId,
      );

      // Store metadata
      await this.storeGenerationMetadata(
        tenantId,
        'prompt-improvement',
        { prompt },
        improvedPrompt,
        userId,
      );

      return improvedPrompt;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Prompt improvement failed: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Generate images using DALL-E 3 or other image generation models
   * 
   * Supported Resolutions (by model):
   * - DALL-E 3: 1024x1024, 1792x1024, 1024x1792
   * 
   * Styles:
   * - vivid: High contrast, saturated colors
   * - natural: Subtle, natural appearance
   */
  async generateImage(
    request: ImageGenerationRequest,
    userId?: string,
    authToken?: string,
  ): Promise<ImageGenerationResponse> {
    this.logger.log(
      `Generating image for tenant ${request.tenant_id} with model ${request.model}`,
    );

    try {
      // Validate resolution
      const validResolutions = ['1024x1024', '1792x1024', '1024x1792'];
      if (
        request.resolution &&
        !validResolutions.includes(request.resolution)
      ) {
        throw new HttpException(
          `Invalid resolution. Must be one of: ${validResolutions.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Call AI Content Service
      const response = await this.aiContentClient.generateImage(request, authToken);

      // Store image and metadata
      const storagePath = await this.storageService.saveImage(
        response.url,
        request.tenant_id,
        userId,
      );

      // Add storage path to response
      response.storage_path = storagePath;

      // Store metadata
      await this.storeGenerationMetadata(
        request.tenant_id,
        'image',
        request,
        response,
        userId,
      );

      return response;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Image generation failed: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Generate videos asynchronously
   * 
   * Supported Models with Duration Constraints:
   * - Sora-2: 4, 8, or 12 seconds
   * - Veo-3.1: 4, 6, or 8 seconds
   * - Runway: 1-60 seconds (any duration)
   * 
   * Returns immediately with job_id for async polling
   */
  async generateVideo(
    request: VideoGenerationRequest,
    webhookUrl?: string,
    userId?: string,
    authToken?: string,
  ): Promise<VideoGenerationResponse> {
    this.logger.log(
      `Generating video for tenant ${request.tenant_id} with model ${request.model}`,
    );

    try {
      // Validate duration per model (if provided)
      if (request.duration_seconds !== undefined) {
        this.validateVideoDuration(request.model, request.duration_seconds);
      }

      // Add webhook URL if provided
      if (webhookUrl) {
        request.webhook_url = webhookUrl;
      }

      // Call AI Content Service (returns immediately with job_id)
      const response = await this.aiContentClient.generateVideo(request, authToken);

      // Store job metadata
      await this.storeGenerationJob(
        request.tenant_id,
        response.job_id,
        'video',
        request,
        userId,
      );

      return response;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Video generation request failed: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Poll job status for asynchronous operations
   * 
   * Possible statuses:
   * - pending: Waiting in queue
   * - processing: Currently generating
   * - completed: Generation finished successfully
   * - failed: Generation failed with error
   */
  async getJobStatus(
    jobId: string,
    tenantId: string,
    authToken?: string,
  ): Promise<JobStatusResponse> {
    try {
      const status = await this.aiContentClient.getJobStatus(jobId, tenantId, authToken);

      // Update job metadata if in database
      if (status.status === 'completed' || status.status === 'failed') {
        await this.updateGenerationJob(jobId, status);
      }

      return status;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to get job status: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Handle webhook callback from AI Content Service
   * Called when async video generation completes
   */
  async handleGenerationCallback(
    jobId: string,
    status: 'success' | 'failure',
    result?: any,
    error?: string,
  ): Promise<void> {
    this.logger.log(`Received callback for job ${jobId} with status ${status}`);

    try {
      // Update job metadata
      const jobMetadata = await this.generationJobModel.findOne({ job_id: jobId });
      if (jobMetadata) {
        jobMetadata.status = status === 'success' ? 'completed' : 'failed';
        jobMetadata.result = result;
        jobMetadata.error = error;
        jobMetadata.completed_at = new Date();
        await jobMetadata.save();

        // Store result if successful
        if (status === 'success' && result?.url) {
          const storagePath = await this.storageService.saveVideo(
            result.url,
            jobMetadata.tenant_id,
            jobMetadata.user_id,
          );
          jobMetadata.storage_path = storagePath;
          await jobMetadata.save();
        }

        this.logger.log(`Job ${jobId} callback processed successfully`);
      } else {
        this.logger.warn(`No job metadata found for ${jobId}`);
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to process callback for job ${jobId}: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * Check if AI Content Service is healthy
   */
  async healthCheck(): Promise<boolean> {
    return this.aiContentClient.healthCheck();
  }

  // ============ Private Methods ============

  /**
   * Validate video duration per model constraints
   */
  private validateVideoDuration(model: string, duration: number): void {
    const modelConstraints = {
      'sora-2': [4, 8, 12],
      'veo-3.1': [4, 6, 8],
      'runway-gen3': { min: 1, max: 60 },
    };

    const constraint = modelConstraints[model.toLowerCase() as keyof typeof modelConstraints];
    if (!constraint) {
      throw new HttpException(
        `Unknown video model: ${model}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (Array.isArray(constraint)) {
      if (!constraint.includes(duration)) {
        throw new HttpException(
          `Invalid duration for ${model}. Must be one of: ${constraint.join(', ')} seconds`,
          HttpStatus.BAD_REQUEST,
        );
      }
    } else {
      if (duration < constraint.min || duration > constraint.max) {
        throw new HttpException(
          `Invalid duration for ${model}. Must be between ${constraint.min} and ${constraint.max} seconds`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  /**
   * Store generation metadata for analytics and history
   */
  private async storeGenerationMetadata(
    tenantId: string,
    type: string,
    request: any,
    response: any,
    userId?: string,
  ): Promise<void> {
    try {
      const metadata = new this.generationJobModel({
        tenant_id: tenantId,
        user_id: userId,
        type,
        request,
        response,
        status: 'completed',
        created_at: new Date(),
      });
      await metadata.save();
    } catch (error) {
      const err = error as Error;
      this.logger.warn(
        `Failed to store generation metadata: ${err.message}`,
      );
    }
  }

  /**
   * Store async generation job for tracking
   */
  private async storeGenerationJob(
    tenantId: string,
    jobId: string,
    type: string,
    request: any,
    userId?: string,
  ): Promise<void> {
    try {
      const job = new this.generationJobModel({
        tenant_id: tenantId,
        user_id: userId,
        job_id: jobId,
        type,
        request,
        status: 'pending',
        created_at: new Date(),
      });
      await job.save();
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`Failed to store generation job: ${err.message}`);
    }
  }

  /**
   * Update generation job with completion status
   */
  private async updateGenerationJob(
    jobId: string,
    status: JobStatusResponse,
  ): Promise<void> {
    try {
      await this.generationJobModel.updateOne(
        { job_id: jobId },
        {
          status: status.status,
          result: status.result,
          error: status.error,
          progress: status.progress,
          completed_at: new Date(),
        },
      );
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`Failed to update generation job: ${err.message}`);
    }
  }
}
