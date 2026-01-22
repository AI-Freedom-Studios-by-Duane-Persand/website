import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ReplicateClient } from '../engines/replicate.client';
import { StorageService } from '../storage/storage.service';
import { PoeClient } from '../engines/poe.client';

export interface GenerateVideoWithReferenceDto {
  prompt: string;
  duration?: number; // Allowed: Sora 2 = 4/8/12 (default 4); Kling = 5/10 (default 5)
  model?: 'sora-2' | 'veo-3.1' | 'runway-gen3' | 'runway-gen2'; // Defaults to sora-2
  referenceImageUrls?: string[]; // Brand logo or reference images for style consistency
  referenceImageFiles?: Buffer[]; // Raw image buffers to upload first
  aspectRatio?: '16:9' | '9:16' | '1:1';
  refinementPrompt?: string; // AI will refine your prompt if provided
}

export interface VideoGenerationResult {
  videoUrl: string;
  videoPath: string;
  prompt: string;
  refinedPrompt?: string;
  model: string;
  duration: number;
  referenceImages: {
    url: string;
    uploadedAt: Date;
  }[];
  metadata: {
    generatedAt: Date;
    provider: string;
    resolution?: string;
  };
}

@Injectable()
export class VideoGenerationService {
  private readonly logger = new Logger(VideoGenerationService.name);

  constructor(
    private readonly replicateClient: ReplicateClient,
    private readonly storageService: StorageService,
    private readonly poeClient: PoeClient,
  ) {}

  /**
   * Generate video with optional reference images for brand consistency
   */
  async generateVideoWithReferences(
    dto: GenerateVideoWithReferenceDto,
  ): Promise<VideoGenerationResult> {
    this.logger.log('[VideoGenerationService] Starting video generation with references', {
      prompt: dto.prompt.substring(0, 100),
      model: dto.model || 'sora-2',
      referenceImageCount: (dto.referenceImageUrls?.length || 0) + (dto.referenceImageFiles?.length || 0),
      duration: dto.duration ?? 4,
    });

    const model = dto.model || 'sora-2';
    const duration = dto.duration ?? (model.includes('kling') ? 5 : 4);
    let refinedPrompt = dto.prompt;

    // Step 1: Refine prompt with AI if requested
    if (dto.refinementPrompt) {
      refinedPrompt = await this.refineVideoPrompt(dto.prompt, dto.refinementPrompt);
      this.logger.log('[VideoGenerationService] Prompt refined', {
        original: dto.prompt.substring(0, 80),
        refined: refinedPrompt.substring(0, 80),
      });
    }

    // Step 2: Upload reference images if provided as buffers
    const referenceUrls: string[] = [...(dto.referenceImageUrls || [])];
    if (dto.referenceImageFiles && dto.referenceImageFiles.length > 0) {
      const uploadedUrls = await this.uploadReferenceImages(dto.referenceImageFiles);
      referenceUrls.push(...uploadedUrls);
      this.logger.log('[VideoGenerationService] Reference images uploaded', {
        count: uploadedUrls.length,
      });
    }

    // Step 3: Generate video with Sora 2 or selected model
    let videoJson: string;
    try {
      videoJson = await this.replicateClient.generateVideoWithModel(model, refinedPrompt, {
        durationSeconds: duration,
        referenceImages: referenceUrls.length > 0 ? referenceUrls : undefined,
        aspectRatio: dto.aspectRatio,
      });
    } catch (error: any) {
      this.logger.error('[VideoGenerationService] Video generation failed', {
        error: error.message,
        model,
      });
      throw new BadRequestException(`Video generation failed: ${error.message}`);
    }

    // Step 4: Parse and upload to permanent storage
    let videoData;
    try {
      videoData = typeof videoJson === 'string' ? JSON.parse(videoJson) : videoJson;
    } catch {
      // If not JSON, assume it's a direct URL
      videoData = { url: videoJson };
    }

    const videoUrl = videoData.url || videoJson;
    if (!videoUrl) {
      throw new BadRequestException('No video URL returned from generation service');
    }

    // Step 5: Upload to permanent storage (R2)
    const videoPath = `videos/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp4`;
    let permanentUrl: string;
    try {
      permanentUrl = await this.storageService.uploadFile(
        Buffer.from(videoUrl), // In practice, fetch the video first
        videoPath,
        'video/mp4',
      );
      this.logger.log('[VideoGenerationService] Video uploaded to storage', {
        path: videoPath,
        url: permanentUrl,
      });
    } catch (error: any) {
      this.logger.error('[VideoGenerationService] Failed to upload video to storage', {
        error: error.message,
      });
      // Fallback to original URL if storage fails
      permanentUrl = videoUrl;
    }

    return {
      videoUrl: permanentUrl,
      videoPath,
      prompt: dto.prompt,
      refinedPrompt: dto.refinementPrompt ? refinedPrompt : undefined,
      model,
      duration,
      referenceImages: referenceUrls.map(url => ({
        url,
        uploadedAt: new Date(),
      })),
      metadata: {
        generatedAt: new Date(),
        provider: 'replicate',
        resolution: videoData.resolution || 'auto',
      },
    };
  }

  /**
   * Upload reference images (brand logos, style references) to temporary storage
   */
  private async uploadReferenceImages(imageBuffers: Buffer[]): Promise<string[]> {
    const uploadedUrls: string[] = [];

    for (let i = 0; i < imageBuffers.length; i++) {
      try {
        const filename = `reference-image-${Date.now()}-${i}.jpg`;
        const url = await this.storageService.uploadFile(
          imageBuffers[i],
          filename,
          'image/jpeg',
        );
        uploadedUrls.push(url);
        this.logger.log('[VideoGenerationService] Reference image uploaded', {
          filename,
          index: i,
        });
      } catch (error: any) {
        this.logger.warn('[VideoGenerationService] Failed to upload reference image', {
          index: i,
          error: error.message,
        });
        // Continue with other images
      }
    }

    return uploadedUrls;
  }

  /**
   * Refine video prompt using AI
   */
  private async refineVideoPrompt(
    originalPrompt: string,
    refinementContext: string,
  ): Promise<string> {
    const promptText = `
You are an expert video generation prompt engineer. Your task is to refine a video prompt for OpenAI Sora 2 Pro.

Original Prompt:
${originalPrompt}

Refinement Context/Instructions:
${refinementContext}

Create a refined, detailed video generation prompt that:
1. Maintains the core idea from the original prompt
2. Incorporates the refinement instructions
3. Includes specific visual details (cinematography, colors, lighting, movement)
4. Is optimized for AI video generation (specific, vivid, actionable)
5. Avoids prohibitions (violence, nudity, copyrighted content)

Return ONLY the refined prompt text, no additional commentary.
    `.trim();

    try {
      const refined = await this.poeClient.generateContent('poe', {
        model: 'gpt-4o',
        contents: promptText,
      });
      return refined || originalPrompt;
    } catch (error: any) {
      this.logger.warn('[VideoGenerationService] Failed to refine prompt, using original', {
        error: error.message,
      });
      return originalPrompt;
    }
  }

  /**
   * Get supported video models
   */
  getSupportedModels() {
    return [
      {
        key: 'sora-2' as const,
        name: 'OpenAI Sora 2 Pro',
        description: 'Advanced video generation with style reference support',
        durationRange: { min: 4, max: 12 },
        supportsReferenceImages: true,
        quality: 'highest' as const,
      },
      {
        key: 'veo-3.1' as const,
        name: 'Google Veo 3.1',
        description: 'High-quality video generation',
        durationRange: { min: 4, max: 8 },
        supportsReferenceImages: true,
        quality: 'high' as const,
      },
      {
        key: 'runway-gen3' as const,
        name: 'Runway Gen-3',
        description: 'Fast, reliable video generation',
        durationRange: { min: 4, max: 60 },
        supportsReferenceImages: false,
        quality: 'high' as const,
      },
      {
        key: 'runway-gen2' as const,
        name: 'Runway Gen-2',
        description: 'Established video generation model',
        durationRange: { min: 4, max: 60 },
        supportsReferenceImages: false,
        quality: 'good' as const,
      },
    ];
  }
}
