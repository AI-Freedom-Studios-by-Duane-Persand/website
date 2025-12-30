import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RenderJobDocument } from '../models/renderJob.model';
import { CreativeDocument } from '../creatives/schemas/creative.schema';
import { StorageService } from '../storage/storage.service';
import { ConfigService } from '../integrations/config.service';

export interface RenderJobInput {
  tenantId: string;
  creativeId: string;
  campaignId: string;
  type: 'image' | 'video';
  provider: string;
  model: string;
  prompt?: string;
  params?: Record<string, any>;
}

export interface ProviderConfig {
  name: string;
  enabled: boolean;
  apiKey?: string;
  endpoint?: string;
  config?: Record<string, any>;
}

export interface RendererProvider {
  name: string;
  canRender(type: 'image' | 'video'): boolean;
  render(jobId: string, input: RenderJobInput): Promise<{ providerJobId: string; estimatedTime?: number }>;
  pollStatus(jobId: string, providerJobId: string): Promise<{ status: 'pending' | 'completed' | 'failed'; progress?: number; outputUrl?: string; error?: any }>;
  handleWebhook(payload: any): Promise<{ jobId: string; status: 'completed' | 'failed'; outputUrl?: string; error?: any }>;
}

@Injectable()
export class MediaRendererService {
  private readonly logger = new Logger(MediaRendererService.name);
  private providers: Map<string, RendererProvider> = new Map();

  constructor(
    @InjectModel('RenderJob') private readonly renderJobModel: Model<RenderJobDocument>,
    @InjectModel('Creative') private readonly creativeModel: Model<CreativeDocument>,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {
    this.logger.log('MediaRendererService initialized');
  }

  /**
   * Register a renderer provider (e.g., Stable Diffusion, Runway)
   */
  registerProvider(provider: RendererProvider) {
    this.providers.set(provider.name, provider);
    this.logger.log(`Provider registered: ${provider.name}`);
  }

  /**
   * Get a registered provider
   */
  getProvider(name: string): RendererProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new BadRequestException(`Renderer provider not found: ${name}`);
    }
    return provider;
  }

  /**
   * Create and queue a render job
   */
  async createRenderJob(input: RenderJobInput, userId: string): Promise<RenderJobDocument> {
    const provider = this.getProvider(input.provider);

    if (!provider.canRender(input.type)) {
      throw new BadRequestException(`Provider ${input.provider} cannot render ${input.type} content`);
    }

    // Validate input
    if (!input.prompt && input.type === 'image') {
      throw new BadRequestException('Image rendering requires a prompt');
    }

    // Create job record
    const job = new this.renderJobModel({
      tenantId: new Types.ObjectId(input.tenantId),
      creativeId: new Types.ObjectId(input.creativeId),
      campaignId: new Types.ObjectId(input.campaignId),
      type: input.type,
      provider: input.provider,
      model: input.model,
      params: input.params || {},
      status: 'queued',
      retryCount: 0,
      maxRetries: 3,
    });

    await job.save();
    this.logger.log(`[createRenderJob] Job created: ${job._id}`, {
      type: input.type,
      provider: input.provider,
      creativeId: input.creativeId,
    });

    // Add log entry
    job.logs.push({
      timestamp: new Date(),
      level: 'info',
      message: `Render job queued for ${input.type} (${input.provider})`,
    });

    return job;
  }

  /**
   * Submit job to provider and track providerJobId
   */
  async submitJob(jobId: string): Promise<RenderJobDocument> {
    const job = await this.renderJobModel.findById(jobId).exec();
    if (!job) {
      throw new BadRequestException(`Render job not found: ${jobId}`);
    }

    try {
      const provider = this.getProvider(job.provider);
      const result = await provider.render(jobId, {
        tenantId: job.tenantId.toString(),
        creativeId: job.creativeId.toString(),
        campaignId: job.campaignId.toString(),
        type: job.type,
        provider: job.provider,
        model: job.model,
        prompt: job.params.prompt,
        params: job.params,
      });

      job.status = 'running';
      job.providerJobId = result.providerJobId;
      job.startedAt = new Date();
      job.logs.push({
        timestamp: new Date(),
        level: 'info',
        message: `Submitted to ${job.provider} with job ID: ${result.providerJobId}`,
      });

      await job.save();
      this.logger.log(`[submitJob] Job submitted: ${jobId}`, {
        providerJobId: result.providerJobId,
      });

      return job;
    } catch (err: any) {
      job.status = 'failed';
      job.error = {
        code: 'SUBMISSION_FAILED',
        message: err.message,
        details: err,
      };
      job.logs.push({
        timestamp: new Date(),
        level: 'error',
        message: `Submission failed: ${err.message}`,
      });

      await job.save();
      this.logger.error(`[submitJob] Job submission failed: ${jobId}`, {
        error: err.message,
      });

      throw err;
    }
  }

  /**
   * Poll provider for job status
   */
  async pollJobStatus(jobId: string): Promise<RenderJobDocument> {
    const job = await this.renderJobModel.findById(jobId).exec();
    if (!job) {
      throw new BadRequestException(`Render job not found: ${jobId}`);
    }

    if (!job.providerJobId) {
      throw new BadRequestException(`Job not yet submitted: ${jobId}`);
    }

    try {
      const provider = this.getProvider(job.provider);
      const status = await provider.pollStatus(jobId, job.providerJobId);

      if (status.status === 'completed' && status.outputUrl) {
        // Upload to R2 if not already there
        const finalUrl = await this.finalizeRender(job, status.outputUrl);
        job.status = 'published';
        job.completedAt = new Date();
        job.outputUrls = { primary: finalUrl };
        job.logs.push({
          timestamp: new Date(),
          level: 'info',
          message: `Render completed and stored at ${finalUrl}`,
        });

        // Update creative with asset
        await this.attachAssetToCreative(job.creativeId.toString(), job.campaignId.toString(), job.type, finalUrl);
      } else if (status.status === 'failed' || status.error) {
        job.status = 'failed';
        job.error = {
          code: 'RENDER_FAILED',
          message: status.error?.message || 'Render failed',
          details: status.error,
        };
        job.logs.push({
          timestamp: new Date(),
          level: 'error',
          message: `Render failed: ${status.error?.message || 'Unknown error'}`,
        });
      } else if (status.progress !== undefined) {
        job.progress = {
          currentStep: Math.round(status.progress),
          totalSteps: 100,
          lastUpdated: new Date(),
        };
        job.logs.push({
          timestamp: new Date(),
          level: 'info',
          message: `Progress: ${status.progress}%`,
        });
      }

      await job.save();
      return job;
    } catch (err: any) {
      job.retryCount++;
      if (job.retryCount >= job.maxRetries) {
        job.status = 'failed';
        job.error = {
          code: 'MAX_RETRIES_EXCEEDED',
          message: `Max retries (${job.maxRetries}) exceeded`,
        };
      }
      job.logs.push({
        timestamp: new Date(),
        level: 'error',
        message: `Poll error: ${err.message}`,
      });

      await job.save();
      this.logger.error(`[pollJobStatus] Poll failed for job ${jobId}`, {
        error: err.message,
        retryCount: job.retryCount,
      });

      throw err;
    }
  }

  /**
   * Handle webhook callback from provider
   */
  async handleProviderWebhook(providerName: string, payload: any): Promise<RenderJobDocument> {
    const provider = this.getProvider(providerName);
    const result = await provider.handleWebhook(payload);

    const job = await this.renderJobModel.findById(result.jobId).exec();
    if (!job) {
      throw new BadRequestException(`Job not found: ${result.jobId}`);
    }

    if (result.status === 'completed' && result.outputUrl) {
      const finalUrl = await this.finalizeRender(job, result.outputUrl);
      job.status = 'published';
      job.completedAt = new Date();
      job.outputUrls = { primary: finalUrl };
      job.logs.push({
        timestamp: new Date(),
        level: 'info',
        message: `Webhook received: render completed at ${finalUrl}`,
      });

      await this.attachAssetToCreative(job.creativeId.toString(), job.campaignId.toString(), job.type, finalUrl);
    } else if (result.status === 'failed') {
      job.status = 'failed';
      job.error = {
        code: 'RENDER_FAILED',
        message: result.error?.message || 'Render failed',
        details: result.error,
      };
      job.logs.push({
        timestamp: new Date(),
        level: 'error',
        message: `Webhook received: render failed - ${result.error?.message || 'Unknown error'}`,
      });
    }

    await job.save();
    this.logger.log(`[handleProviderWebhook] Webhook processed: ${result.jobId}`, {
      status: result.status,
    });

    return job;
  }

  /**
   * Finalize render by uploading to R2 if needed
   */
  private async finalizeRender(job: RenderJobDocument, outputUrl: string): Promise<string> {
    // If output is already a public URL, return it; otherwise download and upload to R2
    if (outputUrl.startsWith('http')) {
      return outputUrl;
    }

    try {
      const response = await fetch(outputUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = job.type === 'video' ? 'video/mp4' : 'image/png';
      const ext = job.type === 'video' ? 'mp4' : 'png';
      const key = `renders/${job.tenantId}/${job.type}/${job._id}.${ext}`;
      const finalUrl = await this.storageService.uploadFile(buffer, key, contentType);
      return finalUrl;
    } catch (err) {
      this.logger.error(`[finalizeRender] Failed to upload to R2`, {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      throw err;
    }
  }

  /**
   * Attach rendered asset to creative and campaign
   */
  private async attachAssetToCreative(creativeId: string, campaignId: string, type: 'image' | 'video', assetUrl: string): Promise<void> {
    try {
      const creative = await this.creativeModel.findById(creativeId).exec();
      if (!creative) {
        this.logger.warn(`Creative not found for asset attachment: ${creativeId}`);
        return;
      }

      if (type === 'image') {
        creative.assets = creative.assets || {};
        const imageUrls = Array.isArray(creative.assets.imageUrls) ? creative.assets.imageUrls : [];
        imageUrls.push(assetUrl);
        creative.assets.imageUrls = imageUrls;
        creative.visual = { ...(creative.visual || {}), imageUrl: assetUrl };
      } else if (type === 'video') {
        creative.assets = { ...(creative.assets || {}), videoUrl: assetUrl };
      }

      creative.status = 'needsReview';
      creative.updatedAt = new Date();
      await creative.save();

      this.logger.log(`[attachAssetToCreative] Asset attached to creative: ${creativeId}`, {
        type,
        assetUrl,
      });
    } catch (err) {
      this.logger.error(`[attachAssetToCreative] Failed to attach asset`, {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  /**
   * Get render job status
   */
  async getJobStatus(jobId: string): Promise<RenderJobDocument> {
    const job = await this.renderJobModel.findById(jobId).exec();
    if (!job) {
      throw new BadRequestException(`Render job not found: ${jobId}`);
    }
    return job;
  }

  /**
   * Cancel a render job
   */
  async cancelJob(jobId: string): Promise<RenderJobDocument> {
    const job = await this.renderJobModel.findById(jobId).exec();
    if (!job) {
      throw new BadRequestException(`Render job not found: ${jobId}`);
    }

    if (['published', 'failed', 'cancelled'].includes(job.status)) {
      throw new BadRequestException(`Cannot cancel job with status: ${job.status}`);
    }

    job.status = 'cancelled';
    job.logs.push({
      timestamp: new Date(),
      level: 'info',
      message: 'Job cancelled by user',
    });

    await job.save();
    this.logger.log(`[cancelJob] Job cancelled: ${jobId}`);

    return job;
  }
}
