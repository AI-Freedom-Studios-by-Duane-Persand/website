import { Injectable, Logger } from '@nestjs/common';
import { RendererProvider, RenderJobInput } from '../media-renderer.service';
import { PoeClient } from '../../engines/poe.client';

/**
 * POE Media Provider - Uses Poe API for image/video generation
 * Supports models like DALL-E, Stable Diffusion, and video models through Poe
 */
@Injectable()
export class PoeMediaProvider implements RendererProvider {
  name = 'poe-media';
  private readonly logger = new Logger(PoeMediaProvider.name);

  constructor(private readonly poeClient: PoeClient) {
    this.logger.log('POE Media Provider initialized');
  }

  canRender(type: 'image' | 'video'): boolean {
    // POE supports both image and video generation
    return true;
  }

  async render(jobId: string, input: RenderJobInput): Promise<{ providerJobId: string; estimatedTime?: number }> {
    try {
      const prompt = input.prompt || '';
      
      if (!prompt) {
        throw new Error('Prompt is required for media generation');
      }

      this.logger.log(`[render] Starting ${input.type} generation via POE`, {
        jobId,
        model: input.model,
        promptLength: prompt.length,
      });

      // For POE, we generate synchronously and return immediately
      // The providerJobId is the same as our jobId since it's not async
      return {
        providerJobId: jobId,
        estimatedTime: input.type === 'image' ? 15 : 60, // seconds
      };
    } catch (err: any) {
      this.logger.error(`[render] Failed to start ${input.type} generation`, {
        jobId,
        error: err.message,
      });
      throw err;
    }
  }

  async pollStatus(jobId: string, providerJobId: string): Promise<{ 
    status: 'pending' | 'completed' | 'failed'; 
    progress?: number; 
    outputUrl?: string; 
    error?: any 
  }> {
    try {
      // Since we don't have async polling with POE yet, return pending
      // The actual generation will happen in a separate process
      this.logger.log(`[pollStatus] Checking status`, { jobId, providerJobId });
      
      return {
        status: 'pending',
        progress: 50,
      };
    } catch (err: any) {
      this.logger.error(`[pollStatus] Status check failed`, {
        jobId,
        error: err.message,
      });
      return {
        status: 'failed',
        error: { message: err.message },
      };
    }
  }

  async handleWebhook(payload: any): Promise<{ 
    jobId: string; 
    status: 'completed' | 'failed'; 
    outputUrl?: string; 
    error?: any 
  }> {
    const { jobId, status, outputUrl, error } = payload;

    this.logger.log(`[handleWebhook] Webhook received`, {
      jobId,
      status,
      hasOutputUrl: !!outputUrl,
    });

    return {
      jobId,
      status: status === 'completed' ? 'completed' : 'failed',
      outputUrl,
      error,
    };
  }

  /**
   * Generate image directly using POE
   */
  async generateImage(model: string, prompt: string, params?: Record<string, any>): Promise<string> {
    try {
      this.logger.log('[generateImage] Generating image via POE', {
        model,
        promptLength: prompt.length,
      });

      // Use POE to generate image URL
      // The POE API should return a URL or base64 image
      const contents = JSON.stringify({
        type: 'image',
        task: 'generate',
        prompt,
        ...params,
      });

      const result = await this.poeClient.generateContent('image-generation', {
        model,
        contents,
      });

      // Parse result - could be URL or base64
      let imageUrl = result;
      try {
        const parsed = JSON.parse(result);
        imageUrl = parsed.url || parsed.imageUrl || parsed.image || result;
      } catch {
        // Result is plain text URL
      }

      this.logger.log('[generateImage] Image generated successfully', {
        model,
        urlLength: imageUrl.length,
      });

      return imageUrl;
    } catch (err: any) {
      this.logger.error('[generateImage] Image generation failed', {
        model,
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Generate video directly using POE
   */
  async generateVideo(model: string, prompt: string, script?: any, params?: Record<string, any>): Promise<string> {
    try {
      this.logger.log('[generateVideo] Generating video via POE', {
        model,
        promptLength: prompt.length,
        hasScript: !!script,
      });

      // Use POE to generate video URL
      const contents = JSON.stringify({
        type: 'video',
        task: 'generate',
        prompt,
        script,
        ...params,
      });

      const result = await this.poeClient.generateContent('video-generation', {
        model,
        contents,
      });

      // Parse result - could be URL
      let videoUrl = result;
      try {
        const parsed = JSON.parse(result);
        videoUrl = parsed.url || parsed.videoUrl || parsed.video || result;
      } catch {
        // Result is plain text URL
      }

      this.logger.log('[generateVideo] Video generated successfully', {
        model,
        urlLength: videoUrl.length,
      });

      return videoUrl;
    } catch (err: any) {
      this.logger.error('[generateVideo] Video generation failed', {
        model,
        error: err.message,
      });
      throw err;
    }
  }
}
