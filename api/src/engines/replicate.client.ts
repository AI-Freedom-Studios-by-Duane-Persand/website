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
        'Authorization': `Token ${this.apiKey}`,
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
   * Generate image using Replicate
   */
  async generateImage(prompt: string, width = 1024, height = 1024): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Replicate API key is required for image generation. Please configure REPLICATE_API_KEY in your environment.');
    }

    try {
      this.logger.info('[ReplicateClient] Generating image', {
        prompt: prompt.substring(0, 100),
        size: `${width}x${height}`,
      });

      // Use Flux Schnell (fast, high-quality)
      const response = await this.axiosInstance.post('/predictions', {
        version: '5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637',
        input: {
          prompt,
          width,
          height,
          num_outputs: 1,
        },
      });

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
      });
      
      if (status === 402) {
        throw new Error('Replicate account has insufficient credits. Please add credits at https://replicate.com/account/billing');
      }
      
      throw new Error(`Failed to generate image: ${error.message}`);
    }
  }

  /**
   * Generate video using Replicate
   */
  async generateVideo(prompt: string, duration = 3): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Replicate API key is required for video generation. Please configure REPLICATE_API_KEY in your environment.');
    }

    try {
      this.logger.info('[ReplicateClient] Generating video', {
        prompt: prompt.substring(0, 100),
        duration,
      });

      // Use Zeroscope (text-to-video)
      const response = await this.axiosInstance.post('/predictions', {
        version: '9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351',
        input: {
          prompt,
          num_frames: duration * 24, // 24 fps
        },
      });

      const predictionId = response.data.id;

      // Poll for completion (videos take longer, can exceed 5 minutes)
      const videoUrl = await this.pollPrediction(predictionId, 600000); // 10 min timeout for long-running videos

      this.logger.info('[ReplicateClient] Video generated successfully', {
        predictionId,
        url: videoUrl.substring(0, 50) + '...',
      });

      return JSON.stringify({ url: videoUrl, prompt, duration, provider: 'replicate' });
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
