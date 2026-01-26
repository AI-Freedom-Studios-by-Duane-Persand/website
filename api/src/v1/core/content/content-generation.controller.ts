import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
  Req,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Request } from 'express';
import { ContentGenerationService } from '../content/content-generation.service';
import {
  TextGenerationRequest,
  ImageGenerationRequest,
  VideoGenerationRequest,
  JobStatusResponse,
} from './types';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';

/**
 * ContentGenerationController (V1 API)
 * 
 * REST endpoints for content generation operations.
 * All endpoints require JWT authentication and tenant context.
 * 
 * Endpoints:
 * - POST /v1/content/generate/text - Generate text content
 * - POST /v1/content/generate/image - Generate images
 * - POST /v1/content/generate/video - Generate videos (async)
 * - GET /v1/content/jobs/:jobId - Poll job status
 * - GET /v1/content/health - Service health check
 */
@Controller('v1/content')
@UseGuards(JwtAuthGuard)
export class ContentGenerationController {
  private readonly logger = new Logger(ContentGenerationController.name);

  constructor(private readonly contentGenerationService: ContentGenerationService) {}

  /**
   * Generate text content with specified system prompt type
   * 
   * System Prompt Types:
   * - creative-copy: Marketing copy for promotions
   * - social-post: Social media posts
   * - ad-script: Direct response advertising scripts
   * - campaign-strategy: Strategic planning
   * - prompt-improver: Enhance weak prompts (internal use)
   * 
   * Example Request:
   * ```json
   * {
   *   "prompt": "Write a funny social media post about coffee",
   *   "model": "gpt-4o",
   *   "system_prompt_type": "social-post",
   *   "tenant_id": "tenant_123",
   *   "max_tokens": 2000,
   *   "temperature": 0.7
   * }
   * ```
   */
  @Post('generate/text')
  @HttpCode(HttpStatus.OK)
  async generateText(
    @Body() request: TextGenerationRequest,
    @Req() httpRequest: Request,
  ) {
    try {
      this.logger.log(
        `Text generation request from tenant ${request.tenant_id}`,
      );

      const userId = (httpRequest.user as any)?.id;
      const authToken = httpRequest.headers.authorization;
      const response = await this.contentGenerationService.generateText(
        request,
        userId,
        authToken,
      );

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Text generation failed: ${err.message}`);
      throw error;
    }
  }

  /**
   * Improve/enhance a user's prompt for better generation results
   * Convenience endpoint that uses the prompt-improver system prompt
   * 
   * Example Request:
   * ```json
   * {
   *   "prompt": "Make a video about AI",
   *   "tenant_id": "tenant_123"
   * }
   * ```
   * 
   * Returns enhanced prompt that can be used for better image/video generation
   */
  @Post('improve-prompt')
  @HttpCode(HttpStatus.OK)
  async improvePrompt(
    @Body() body: { prompt: string; tenant_id: string },
    @Req() httpRequest: Request,
  ) {
    try {
      if (!body.prompt || !body.tenant_id) {
        throw new BadRequestException('prompt and tenant_id are required');
      }

      this.logger.log(
        `Prompt improvement request from tenant ${body.tenant_id}`,
      );

      const userId = (httpRequest.user as any)?.id;
      const response = await this.contentGenerationService.improvePrompt(
        body.prompt,
        body.tenant_id,
        userId,
      );

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Prompt improvement failed: ${err.message}`);
      throw error;
    }
  }

  /**
   * Generate images using DALL-E 3
   * 
   * Supported Resolutions:
   * - 1024x1024, 1792x1024, 1024x1792
   * 
   * Styles: vivid, natural
   * 
   * Example Request:
   * ```json
   * {
   *   "prompt": "A serene mountain landscape at sunset",
   *   "model": "dall-e-3",
   *   "resolution": "1024x1024",
   *   "style": "vivid",
   *   "tenant_id": "tenant_123"
   * }
   * ```
   */
  @Post('generate/image')
  @HttpCode(HttpStatus.OK)
  async generateImage(
    @Body() request: ImageGenerationRequest,
    @Req() httpRequest: Request,
  ) {
    try {
      this.logger.log(
        `Image generation request from tenant ${request.tenant_id}`,
      );

      const userId = (httpRequest.user as any)?.id;
      const authToken = httpRequest.headers.authorization;
      const response = await this.contentGenerationService.generateImage(
        request,
        userId,
        authToken,
      );

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Image generation failed: ${err.message}`);
      throw error;
    }
  }

  /**
   * Generate videos asynchronously
   * Returns immediately with job_id for async polling
   * 
   * Supported Models:
   * - sora-2: 4, 8, or 12 seconds
   * - veo-3.1: 4, 6, or 8 seconds
   * - runway-gen3: 1-60 seconds
   * 
   * Optional Parameters:
   * - webhook_url: URL to receive completion callback
   * 
   * Example Request:
   * ```json
   * {
   *   "prompt": "A cinematic shot of mountains with dramatic lighting",
   *   "model": "sora-2",
   *   "duration_seconds": 8,
   *   "aspect_ratio": "16:9",
   *   "tenant_id": "tenant_123",
   *   "webhook_url": "https://example.com/webhooks/video-complete"
   * }
   * ```
   * 
   * Response:
   * ```json
   * {
   *   "job_id": "550e8400-e29b-41d4-a716-446655440000",
   *   "status": "processing",
   *   "created_at": "2026-01-24T10:00:00Z"
   * }
   * ```
   */
  @Post('generate/video')
  @HttpCode(HttpStatus.ACCEPTED)
  async generateVideo(
    @Body() request: VideoGenerationRequest,
    @Req() httpRequest: Request,
  ) {
    try {
      this.logger.log(
        `Video generation request from tenant ${request.tenant_id}`,
      );

      const userId = (httpRequest.user as any)?.id;
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
      const webhookUrl = `${baseUrl}/v1/content/webhooks/video-complete`;
      const authToken = httpRequest.headers.authorization;

      const response = await this.contentGenerationService.generateVideo(
        request,
        webhookUrl,
        userId,
        authToken,
      );

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Video generation request failed: ${err.message}`);
      throw error;
    }
  }

  /**
   * Poll job status for async operations
   * 
   * Returns:
   * - status: pending, processing, completed, failed
   * - progress: percentage (0-100)
   * - result: URL when completed
   * - error: error message if failed
   * 
   * Example Response:
   * ```json
   * {
   *   "job_id": "550e8400-e29b-41d4-a716-446655440000",
   *   "status": "processing",
   *   "progress": 45,
   *   "created_at": "2026-01-24T10:00:00Z"
   * }
   * ```
   */
  @Get('jobs/:jobId')
  async getJobStatus(
    @Param('jobId') jobId: string,
    @Req() httpRequest: Request,
  ) {
    try {
      const tenantId = (httpRequest.user as any)?.tenant_id;
      if (!tenantId) {
        throw new BadRequestException('tenant_id required in JWT context');
      }

      this.logger.log(
        `Job status request for ${jobId} from tenant ${tenantId}`,
      );

      const authToken = httpRequest.headers.authorization;
      const response = await this.contentGenerationService.getJobStatus(
        jobId,
        tenantId,
        authToken,
      );

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Job status fetch failed: ${err.message}`);
      throw error;
    }
  }

  /**
   * Webhook endpoint for video generation completion
   * Called by Python AI Content Service when async video generation completes
   * 
   * This endpoint receives callbacks from the microservice and updates job status
   */
  @Post('webhooks/video-complete')
  @HttpCode(HttpStatus.OK)
  async handleVideoCompletionCallback(@Body() payload: any) {
    try {
      this.logger.log(
        `Received video completion webhook for job ${payload.job_id}`,
      );

      await this.contentGenerationService.handleGenerationCallback(
        payload.job_id,
        payload.status as 'success' | 'failure',
        payload.result,
        payload.error,
      );

      return {
        success: true,
        message: 'Callback processed',
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to process callback: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Health check for content generation service
   * Verifies connectivity to Python AI Content Service
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async healthCheck() {
    try {
      const isHealthy = await this.contentGenerationService.healthCheck();

      if (!isHealthy) {
        throw new ServiceUnavailableException(
          'AI Content Service is unavailable',
        );
      }

      return {
        success: true,
        status: 'healthy',
        message: 'Content generation service is running',
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Health check failed: ${err.message}`);
      throw error;
    }
  }
}
