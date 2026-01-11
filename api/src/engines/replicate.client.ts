// api/src/engines/replicate.client.ts
// Replicate API client for actual image/video generation
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { createLogger, format, transports } from 'winston';

interface ReplicateModel {
  owner: string;
  name: string;
  version: string;
}

@Injectable()
export class ReplicateClient {
  private readonly apiUrl = 'https://api.replicate.com/v1';
  private readonly apiKey: string;
  private logger;
  private axiosInstance: AxiosInstance;

  // Popular models for image/video generation
  private readonly models = {
    // Image generation models
    'flux-schnell': {
      owner: 'black-forest-labs',
      name: 'flux-schnell',
      version: 'latest',
      type: 'image',
    },
    'sdxl': {
      owner: 'stability-ai',
      name: 'sdxl',
      version: 'latest',
      type: 'image',
    },
    // Video generation models
    'runway-gen2': {
      owner: 'runwayml',
      name: 'gen2',
      version: 'latest',
      type: 'video',
    },
    'zeroscope': {
      owner: 'anotherjesse',
      name: 'zeroscope-v2-xl',
      version: 'latest',
      type: 'video',
    },
  };

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

    this.axiosInstance = axios.create({
      baseURL: this.apiUrl,
      timeout: 120000, // 2 minutes for video generation
      headers: {
        // Replicate HTTP API expects Bearer token per official docs
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
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
        { key: 'dall-e-3', displayName: 'DALL-E 3 (via OpenAI)', type: 'image' }, // included for parity in UI
        { key: 'sdxl', displayName: 'Stable Diffusion XL', type: 'image' },
        { key: 'flux-schnell', displayName: 'Flux Schnell', type: 'image' },
      ];
    }
    return [
      { key: 'zeroscope', displayName: 'Zeroscope v2 XL', type: 'video' },
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
   */
  async generateVideoWithModel(
    modelKey: 'zeroscope' | 'runway-gen2',
    prompt: string,
    options: {
      durationSeconds?: number;
      fps?: number;
      negativePrompt?: string;
      numInferenceSteps?: number;
      guidanceScale?: number;
    } = {},
  ): Promise<string> {
    // Currently generateVideo uses Zeroscope configuration constants.
    // For Runway Gen2, Replicate may require different version; add basic branching.
    if (!this.apiKey) {
      throw new Error('Replicate API key is required for video generation. Please configure REPLICATE_API_KEY in your environment.');
    }

    const durationSeconds = options.durationSeconds ?? 10;
    const fps = options.fps ?? 24;
    const num_frames = durationSeconds * fps;
    const negative_prompt = options.negativePrompt ?? 'blurry, low quality, watermark, distorted, artifacts';
    const num_inference_steps = options.numInferenceSteps ?? 24;
    const guidance_scale = options.guidanceScale ?? 6.0;

    const version = modelKey === 'runway-gen2'
      ? 'ccbd4d15b6f7d8017c3d8a25925b9e0b20b7f84dbb7cbac2b4b5073b3c5f10e7' // placeholder version id for Runway Gen-2 (example)
      : '9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351'; // Zeroscope v2 XL

    this.logger.info('[ReplicateClient] Generating video with model', {
      modelKey,
      prompt: prompt.substring(0, 120),
      durationSeconds,
      fps,
      num_frames,
      guidance_scale,
      num_inference_steps,
    });

    const response = await this.axiosInstance.post('/predictions', {
      version,
      input: {
        prompt,
        negative_prompt,
        num_frames,
        fps,
        num_inference_steps,
        guidance_scale,
      },
    });

    const predictionId = response.data.id;
    const videoUrl = await this.pollPrediction(predictionId, 600000);
    return JSON.stringify({ url: videoUrl, prompt, durationSeconds, fps, provider: 'replicate', model: modelKey });
  }

  /**
   * Generate image using Replicate
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
      // Normalize dimensions to multiples of 16 (required by image generation models)
      const normalizeToMultiple = (value: number, multiple: number) => {
        return Math.round(value / multiple) * multiple;
      };

      // Replicate API limits for SDXL and Flux models
      const MAX_WIDTH = 1280;
      const MAX_HEIGHT = 1280;
      const MIN_DIMENSION = 256;

      // Parse env vars with proper NaN handling
      const parsedWidth = Number(process.env.DEFAULT_IMAGE_WIDTH);
      const parsedHeight = Number(process.env.DEFAULT_IMAGE_HEIGHT);
      
      const envDefaultWidth = (Number.isFinite(parsedWidth) && parsedWidth > 0) ? parsedWidth : 1024;
      const envDefaultHeight = (Number.isFinite(parsedHeight) && parsedHeight > 0) ? parsedHeight : 576;
      
      // Constrain and normalize dimensions
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

      // Try SDXL first (supports quality parameters), fallback to Flux Schnell
      const useSDXL = options.numInferenceSteps || options.guidanceScale;
      
      let response;
      if (useSDXL) {
        // SDXL: supports advanced quality parameters
        try {
          response = await this.axiosInstance.post('/predictions', {
            version: '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b', // SDXL
            input: {
              prompt,
              width,
              height,
              num_outputs: 1,
              num_inference_steps: options.numInferenceSteps ?? 50,
              guidance_scale: options.guidanceScale ?? 7.5,
              negative_prompt: options.negativePrompt ?? 'ugly, blurry, poor quality',
              scheduler: options.scheduler ?? 'DPMSolverMultistep',
            },
          });
          this.logger.info('[ReplicateClient] Using SDXL for quality generation');
        } catch (err: any) {
          this.logger.warn('[ReplicateClient] SDXL failed, falling back to Flux Schnell', { error: err.message });
          response = null;
        }
      }

      // Fallback to Flux Schnell (fast, reliable, but fewer parameters)
      if (!response) {
        response = await this.axiosInstance.post('/predictions', {
          version: '5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637', // Flux Schnell
          input: {
            prompt,
            width,
            height,
            num_outputs: 1,
          },
        });
        this.logger.info('[ReplicateClient] Using Flux Schnell for fast generation');
      }

      const predictionId = response.data.id;
      
      // Poll for completion
      const imageUrl = await this.pollPrediction(predictionId);

      this.logger.info('[ReplicateClient] Image generated successfully', {
        predictionId,
        url: imageUrl.substring(0, 50) + '...',
      });

      return JSON.stringify({ url: imageUrl, prompt, provider: 'replicate' });
    } catch (error: any) {
      const status = error.response?.status;
      this.logger.error('[ReplicateClient] Error generating image', {
        error: error.message,
        status,
        responseData: error.response?.data,
      });
      
      if (status === 402) {
        throw new Error('Replicate account has insufficient credits. Please add credits at https://replicate.com/account/billing');
      }

      if (status === 422) {
        throw new Error(`Invalid parameters for image generation: ${error.response?.data?.detail || error.message}`);
      }
      
      throw new Error(`Failed to generate image: ${error.message}`);
    }
  }

  /**
   * Generate video using Replicate
   */
  async generateVideo(
    prompt: string,
    options: {
      durationSeconds?: number;
      fps?: number;
      negativePrompt?: string;
      numInferenceSteps?: number;
      guidanceScale?: number;
    } = {},
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Replicate API key is required for video generation. Please configure REPLICATE_API_KEY in your environment.');
    }

    try {
      const durationSeconds = options.durationSeconds ?? 10;
      const fps = options.fps ?? 24;
      const num_frames = durationSeconds * fps;
      const negative_prompt = options.negativePrompt ?? 'blurry, low quality, watermark, distorted, artifacts';
      const num_inference_steps = options.numInferenceSteps ?? 24;
      const guidance_scale = options.guidanceScale ?? 6.0;

      this.logger.info('[ReplicateClient] Generating video', {
        prompt: prompt.substring(0, 120),
        durationSeconds,
        fps,
        num_frames,
        guidance_scale,
        num_inference_steps,
      });

      // Use Zeroscope (text-to-video)
      const response = await this.axiosInstance.post('/predictions', {
        version: '9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351',
        input: {
          prompt,
          negative_prompt,
          num_frames,
          fps,
          num_inference_steps,
          guidance_scale,
        },
      });

      const predictionId = response.data.id;

      // Poll for completion (videos take longer, can exceed 5 minutes)
      const videoUrl = await this.pollPrediction(predictionId, 600000); // 10 min timeout for long-running videos

      this.logger.info('[ReplicateClient] Video generated successfully', {
        predictionId,
        url: videoUrl.substring(0, 50) + '...',
      });

      return JSON.stringify({ url: videoUrl, prompt, durationSeconds, fps, provider: 'replicate' });
    } catch (error: any) {
      const status = error.response?.status;
      this.logger.error('[ReplicateClient] Error generating video', {
        error: error.message,
        status,
      });
      
      if (status === 402) {
        throw new Error('Replicate account has insufficient credits. Please add credits at https://replicate.com/account/billing');
      }
      
      throw new Error(`Failed to generate video: ${error.message}`);
    }
  }

  /**
   * Poll Replicate prediction until completion
   * Increased timeout for video generation; includes backoff and connection recovery
   */
  private async pollPrediction(predictionId: string, timeout = 60000): Promise<string> {
    const startTime = Date.now();
    let attempts = 0;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5;

    while (Date.now() - startTime < timeout) {
      attempts++;
      
      try {
        const response = await this.axiosInstance.get(`/predictions/${predictionId}`);
        const { status, output, error } = response.data;

        // Reset error counter on successful poll
        consecutiveErrors = 0;

        if (status === 'succeeded' && output) {
          const url = Array.isArray(output) ? output[0] : output;
          return url;
        }

        if (status === 'failed' || error) {
          throw new Error(`Prediction failed: ${error || 'Unknown error'}`);
        }

        if (status === 'canceled') {
          throw new Error('Prediction was canceled');
        }

        // Wait before next poll (exponential backoff: 1s → 2s → 4s → max 10s)
        const delay = Math.min(1000 * Math.pow(1.5, Math.min(attempts, 8)), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error: any) {
        consecutiveErrors++;

        if (error.response?.status === 404) {
          throw new Error('Prediction not found');
        }

        // Log but continue on transient network errors (e.g., ECONNRESET)
        if (consecutiveErrors <= maxConsecutiveErrors) {
          this.logger.warn('[pollPrediction] Transient error during polling', {
            error: error.message,
            predictionId,
            attempt: attempts,
            consecutiveErrors,
          });
          // Wait longer after connection error before retry
          const delay = Math.min(2000 * consecutiveErrors, 15000);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw new Error(`Polling failed after ${maxConsecutiveErrors} consecutive errors: ${error.message}`);
        }
      }
    }

    throw new Error('Prediction timeout - generation took too long');
  }

}
