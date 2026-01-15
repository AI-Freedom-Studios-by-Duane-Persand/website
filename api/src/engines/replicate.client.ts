// api/src/engines/replicate.client.ts
// Replicate API client for image/video generation using official SDK
import { Injectable, Logger } from '@nestjs/common';
import Replicate from 'replicate';
import { createLogger, format, transports } from 'winston';

@Injectable()
export class ReplicateClient {
  private readonly apiKey: string;
  private readonly replicate: Replicate;
  private logger;

  constructor() {
    this.apiKey = process.env.REPLICATE_API_KEY || '';

    // Initialize Winston logger
    this.logger = createLogger({
      level: 'info',
      format: format.combine(format.timestamp(), format.json()),
      transports: [
        new transports.Console(),
        new transports.File({ filename: 'logs/replicate-client.log' }),
      ],
    });

    // Initialize official Replicate SDK
    this.replicate = new Replicate({
      auth: this.apiKey,
    });

    const logger = new Logger(ReplicateClient.name);
    if (this.apiKey) {
      logger.log('ReplicateClient initialized with API key');
    } else {
      logger.warn('ReplicateClient initialized without API key - will use mock URLs');
    }
  }

  /**
   * List Replicate models by content type
   */
  listModelsByContentType(contentType: 'image-generation' | 'video-generation') {
    if (contentType === 'image-generation') {
      return [
        { key: 'sdxl', displayName: 'Stable Diffusion XL', type: 'image' },
        { key: 'flux-schnell', displayName: 'Flux Schnell', type: 'image' },
      ];
    }
    return [
      { key: 'runway-gen3', displayName: 'Runway Gen-3 (Recommended)', type: 'video' },
      { key: 'runway-gen2', displayName: 'Runway Gen-2', type: 'video' },
    ];
  }

  /**
   * Generate image with explicit Replicate model selection
   */
  async generateImageWithModel(
    modelKey: 'sdxl' | 'flux-schnell',
    prompt: string,
    options: {
      width?: number;
      height?: number;
      negativePrompt?: string;
      numInferenceSteps?: number;
      guidanceScale?: number;
      scheduler?: string;
    } = {},
  ): Promise<string> {
    // Route to appropriate generator based on modelKey
    if (modelKey === 'sdxl') {
      return this.generateImage(prompt, {
        width: options.width,
        height: options.height,
        negativePrompt: options.negativePrompt,
        numInferenceSteps: options.numInferenceSteps ?? 50,
        guidanceScale: options.guidanceScale ?? 7.5,
        scheduler: options.scheduler ?? 'DPMSolverMultistep',
      });
    }
    // Flux Schnell path
    return this.generateImage(prompt, {
      width: options.width,
      height: options.height,
    });
  }

  /**
   * Generate video with explicit Replicate model selection
   * Uses official Replicate SDK for simplified API handling
   */
  async generateVideoWithModel(
    modelKey: 'runway-gen3' | 'runway-gen2' | 'veo-3.1',
    prompt: string,
    options: {
      durationSeconds?: number;
      fps?: number;
      negativePrompt?: string;
      resolution?: '480p' | '720p' | '1080p';
      aspectRatio?: '16:9' | '9:16' | '1:1';
      generateAudio?: boolean;
      referenceImages?: string[];
    } = {},
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Replicate API key is required for video generation. Please configure REPLICATE_API_KEY in your environment.');
    }

    // Veo 3.1 is now available on Replicate via google/veo-3.1
    const actualModelKey = modelKey;

    const requestedDuration = options.durationSeconds ?? 8;
    const fps = options.fps ?? 24;
    const resolution = options.resolution ?? '1080p';
    const aspectRatio = options.aspectRatio ?? '16:9';
    const generateAudio = options.generateAudio ?? true;
    const referenceImages = options.referenceImages ?? [];
    const negative_prompt = options.negativePrompt ?? 'blurry, low quality, watermark, distorted, artifacts';

    // Veo 3.1 only accepts duration values of 4, 6, or 8 seconds
    let adjustedDuration: number;
    if (requestedDuration <= 4) {
      adjustedDuration = 4;
    } else if (requestedDuration <= 6) {
      adjustedDuration = 6;
    } else {
      adjustedDuration = 8;
    }

    if (adjustedDuration !== requestedDuration) {
      this.logger.warn('[ReplicateClient] Adjusted duration for Veo 3.1', {
        requested: requestedDuration,
        adjusted: adjustedDuration,
        note: 'Veo 3.1 only supports 4, 6, or 8 seconds',
      });
    }

    const num_frames = adjustedDuration * fps;

    // Model identifiers for Replicate SDK
    // Using Google Veo 3.1 via Replicate
    const modelId = 'google/veo-3.1';

    this.logger.info('[ReplicateClient] Generating video with model', {
      requestedModelKey: modelKey,
      actualModelKey,
      modelId,
      prompt: prompt.substring(0, 120),
      durationSeconds: adjustedDuration,
    });

    // Build input based on Veo 3.1 parameters
    const input: Record<string, any> = {
      prompt,
      duration: adjustedDuration, // in seconds (1-10)
      resolution: resolution || '1080p', // '480p', '720p', '1080p'
      aspect_ratio: aspectRatio || '16:9', // '16:9', '9:16', '1:1'
      generate_audio: generateAudio !== undefined ? generateAudio : true,
    };

    // Add reference_images if provided
    if (referenceImages && referenceImages.length > 0) {
      input.reference_images = referenceImages.map(url => ({ value: url }));
    }

    try {
      this.logger.info('[ReplicateClient] Calling Replicate SDK', {
        modelId,
        inputKeys: Object.keys(input),
      });

      // Use official Replicate SDK to generate video
      const output = await this.replicate.run(modelId, { input });
      
      // Extract video URL from output
      let videoUrl: string = '';
      if (typeof output === 'string') {
        videoUrl = output;
      } else if (Array.isArray(output) && output.length > 0) {
        videoUrl = output[0] as string;
      } else if (output && typeof output === 'object') {
        videoUrl = (output as any).url || (output as any)[0];
      }

      if (!videoUrl || typeof videoUrl !== 'string') {
        throw new Error('No valid video URL returned from Replicate');
      }
      
      this.logger.info('[ReplicateClient] Video generated successfully', {
        requestedModel: modelKey,
        actualModel: actualModelKey,
        url: videoUrl.substring(0, 50) + '...',
      });
      
      return JSON.stringify({ 
        url: videoUrl, 
        prompt, 
        durationSeconds: adjustedDuration, 
        fps, 
        provider: 'replicate', 
        model: modelKey,
        actualModel: actualModelKey,
      });
    } catch (error: any) {
      this.logger.error('[ReplicateClient] Error generating video', {
        error: error?.message,
        modelKey: actualModelKey,
        stack: error?.stack?.substring(0, 300),
      });
      
      if (error?.message?.includes('insufficient credits')) {
        throw new Error('Replicate account has insufficient credits. Please add credits at https://replicate.com/account/billing');
      }
      
      throw new Error(`Failed to generate video with ${modelKey}: ${error?.message}`);
    }
  }

  /**
   * Generate image using Replicate SDK
   */
  async generateImage(
    prompt: string,
    options: {
      width?: number;
      height?: number;
      negativePrompt?: string;
      numInferenceSteps?: number;
      guidanceScale?: number;
      scheduler?: string;
    } = {},
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Replicate API key is required for image generation. Please configure REPLICATE_API_KEY in your environment.');
    }

    try {
      // Normalize dimensions to multiples of 16
      const normalizeToMultiple = (value: number, multiple: number) => {
        return Math.round(value / multiple) * multiple;
      };

      const MAX_WIDTH = 1280;
      const MAX_HEIGHT = 1280;
      const MIN_DIMENSION = 256;

      const parsedWidth = Number(process.env.DEFAULT_IMAGE_WIDTH);
      const parsedHeight = Number(process.env.DEFAULT_IMAGE_HEIGHT);
      
      const envDefaultWidth = (Number.isFinite(parsedWidth) && parsedWidth > 0) ? parsedWidth : 1024;
      const envDefaultHeight = (Number.isFinite(parsedHeight) && parsedHeight > 0) ? parsedHeight : 576;
      
      const requestedWidth = options.width ?? envDefaultWidth;
      const requestedHeight = options.height ?? envDefaultHeight;
      
      const width = normalizeToMultiple(
        Math.max(MIN_DIMENSION, Math.min(MAX_WIDTH, requestedWidth)), 
        16
      );
      const height = normalizeToMultiple(
        Math.max(MIN_DIMENSION, Math.min(MAX_HEIGHT, requestedHeight)), 
        16
      );

      this.logger.info('[ReplicateClient] Generating image', {
        prompt: prompt.substring(0, 120),
        size: `${width}x${height}`,
      });

      // Use Flux Schnell - fast and reliable
      const modelId = 'black-forest-labs/flux-schnell';
      
      const input = {
        prompt,
        width,
        height,
        num_outputs: 1,
      };

      const output = await this.replicate.run(modelId, { input });
      
      let imageUrl: string = '';
      if (typeof output === 'string') {
        imageUrl = output;
      } else if (Array.isArray(output) && output.length > 0) {
        imageUrl = output[0] as string;
      } else if (output && typeof output === 'object') {
        imageUrl = (output as any).url || (output as any)[0];
      }

      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new Error('No valid image URL returned from Replicate');
      }

      this.logger.info('[ReplicateClient] Image generated successfully', {
        size: `${width}x${height}`,
        url: imageUrl.substring(0, 50) + '...',
      });

      return imageUrl;
    } catch (error: any) {
      this.logger.error('[ReplicateClient] Error generating image', {
        error: error?.message,
        stack: error?.stack?.substring(0, 300),
      });
      throw new Error(`Failed to generate image: ${error?.message}`);
    }
  }

  /**
   * Generate video using Replicate (defaults to Runway Gen-3 for best quality)
   */
  async generateVideo(
    prompt: string,
    options: {
      durationSeconds?: number;
      fps?: number;
      negativePrompt?: string;
      resolution?: '480p' | '720p' | '1080p';
      aspectRatio?: '16:9' | '9:16' | '1:1';
      generateAudio?: boolean;
      referenceImages?: string[];
    } = {},
  ): Promise<string> {
    // Delegate to generateVideoWithModel with Veo 3.1 (best quality)
    return this.generateVideoWithModel('veo-3.1', prompt, options);
  }
}
