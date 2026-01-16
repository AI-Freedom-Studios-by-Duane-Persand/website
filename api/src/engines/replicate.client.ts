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
        { key: 'nano-banana', displayName: 'Google Nano Banana', type: 'image' },
      ];
    }
    return [
      { key: 'sora-2', displayName: 'OpenAI Sora 2', type: 'video' },
      { key: 'veo-3.1', displayName: 'Google Veo 3.1', type: 'video' },
      { key: 'runway-gen3', displayName: 'Runway Gen-3', type: 'video' },
      { key: 'runway-gen2', displayName: 'Runway Gen-2', type: 'video' },
    ];
  }

  /**
   * Generate image with explicit Replicate model selection
   */
  async generateImageWithModel(
    modelKey: 'sdxl' | 'flux-schnell' | 'nano-banana',
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
    // Nano Banana (default fast image model)
    return this.generateImage(prompt, {
      width: options.width,
      height: options.height,
    });
  }

  /**
   * Generate video with explicit Replicate model selection
   * Uses official Replicate SDK for simplified API handling
   * Supports: Sora 2, Veo 3.1, Runway Gen-3/Gen-2
   */
  async generateVideoWithModel(
    modelKey: 'sora-2' | 'runway-gen3' | 'runway-gen2' | 'veo-3.1',
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

    // Route Sora 2 to dedicated handler
    if (modelKey === 'sora-2') {
      return this.generateVideoWithSora2(prompt, options);
    }

    const actualModelKey = modelKey;

    const requestedDuration = options.durationSeconds ?? 5;
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
    let modelId: `${string}/${string}`;
    if (modelKey === 'veo-3.1') {
      modelId = 'google/veo-3.1';
    } else if (modelKey === 'runway-gen3') {
      modelId = 'runwayml/gen-3-alpha';
    } else if (modelKey === 'runway-gen2') {
      modelId = 'runwayml/gen-2';
    } else {
      // Fallback to Runway Gen-3
      modelId = 'runwayml/gen-3-alpha';
    }

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

      // Use Google Nano Banana as primary image model
      const modelId = 'google/nano-banana';
      
      const input = {
        prompt,
        width,
        height,
        num_outputs: 1,
      };

      // Use predictions API for better control
      let prediction = await this.replicate.predictions.create({
        model: modelId,
        input,
      });

      // Wait for completion
      prediction = await this.replicate.wait(prediction);

      this.logger.info('[ReplicateClient] Image prediction completed', {
        status: prediction.status,
        outputType: typeof prediction.output,
        error: prediction.error,
      });

      // Check for errors
      if (prediction.status === 'failed') {
        throw new Error(`Prediction failed: ${prediction.error || 'Unknown error'}`);
      }

      const output = prediction.output;
      
      let imageUrl: string = '';
      if (typeof output === 'string') {
        imageUrl = output;
      } else if (Array.isArray(output) && output.length > 0) {
        const result = output[0];
        imageUrl = typeof result === 'string' ? result : String(result);
      } else if (output && typeof output === 'object') {
        imageUrl = (output as any).url || (output as any).href || (output as any)[0];
      }

      if (!imageUrl || typeof imageUrl !== 'string') {
        this.logger.error('[ReplicateClient] Failed to extract image URL', {
          output: prediction.output,
          outputType: typeof prediction.output,
        });
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
   * Generate video using OpenAI Sora 2 Pro with image reference support
   */
  private async generateVideoWithSora2(
    prompt: string,
    options: {
      durationSeconds?: number;
      fps?: number;
      resolution?: string;
      aspectRatio?: string;
      generateAudio?: boolean;
      referenceImages?: string[];
      negativePrompt?: string;
    } = {},
  ): Promise<string> {
    const requestedDuration = options.durationSeconds ?? 6;
    
    // Sora 2 accepts 5-60 seconds
    const adjustedDuration = Math.max(5, Math.min(60, requestedDuration));
    if (adjustedDuration !== requestedDuration) {
      this.logger.warn('[ReplicateClient] Adjusted duration for Sora 2', {
        requested: requestedDuration,
        adjusted: adjustedDuration,
        note: 'Sora 2 supports 5-60 seconds',
      });
    }

    const input: Record<string, any> = {
      prompt,
      duration: adjustedDuration,
    };

    // Add reference images if provided (Sora 2 supports image_input for style reference)
    if (options.referenceImages && options.referenceImages.length > 0) {
      input.image_input = options.referenceImages;
      this.logger.info('[ReplicateClient] Using reference images for Sora 2', {
        imageCount: options.referenceImages.length,
      });
    }

    try {
      this.logger.info('[ReplicateClient] Generating video with Sora 2', {
        prompt: prompt.substring(0, 120),
        durationSeconds: adjustedDuration,
        hasReferenceImages: options.referenceImages && options.referenceImages.length > 0,
      });

      const modelId = 'openai/sora-2';
      
      // Use predictions.create and wait for completion
      let prediction = await this.replicate.predictions.create({
        model: modelId,
        input,
      });

      this.logger.info('[ReplicateClient] Prediction created', {
        id: prediction.id,
        status: prediction.status,
      });

      // Wait for prediction to complete - this updates the prediction object
      prediction = await this.replicate.wait(prediction);
      
      this.logger.info('[ReplicateClient] Prediction completed', {
        id: prediction.id,
        status: prediction.status,
        outputType: typeof prediction.output,
        outputValue: prediction.output,
        error: prediction.error,
      });

      // Check for errors
      if (prediction.status === 'failed') {
        throw new Error(`Prediction failed: ${prediction.error || 'Unknown error'}`);
      }

      // Extract video URL from completed prediction
      let videoUrl: string = '';
      const output = prediction.output;
      
      if (typeof output === 'string') {
        videoUrl = output;
      } else if (Array.isArray(output)) {
        if (output.length > 0) {
          const result = output[0];
          videoUrl = typeof result === 'string' ? result : (result?.url || result?.href || String(result));
        }
      } else if (output && typeof output === 'object') {
        const obj = output as any;
        videoUrl = obj.url || obj.href || obj.output || obj.video_url || obj.mp4;
        
        if (!videoUrl && Array.isArray(obj.output) && obj.output.length > 0) {
          const result = obj.output[0];
          videoUrl = typeof result === 'string' ? result : (result?.url || result?.href);
        }
      }

      if (!videoUrl || typeof videoUrl !== 'string') {
        throw new Error('No valid video URL returned from Sora 2');
      }

      this.logger.info('[ReplicateClient] Sora 2 video generated successfully', {
        url: videoUrl.substring(0, 50) + '...',
        duration: adjustedDuration,
      });

      return JSON.stringify({
        url: videoUrl,
        prompt,
        durationSeconds: adjustedDuration,
        provider: 'replicate',
        model: 'sora-2',
        referenceImagesCount: options.referenceImages?.length || 0,
      });
    } catch (error: any) {
      this.logger.error('[ReplicateClient] Error generating video with Sora 2', {
        error: error?.message,
        stack: error?.stack?.substring(0, 300),
      });
      throw new Error(`Failed to generate video with Sora 2: ${error?.message}`);
    }
  }

  /**
   * Generate video using Replicate (defaults to Sora 2 for best quality)
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
    // Delegate to generateVideoWithModel with Sora 2 (best quality)
    return this.generateVideoWithModel('sora-2', prompt, options);
  }
}
