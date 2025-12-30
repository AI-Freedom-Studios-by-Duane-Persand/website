import { Injectable, Logger } from '@nestjs/common';
import { RendererProvider, RenderJobInput } from '../media-renderer.service';
import { ConfigService } from '../../integrations/config.service';

/**
 * Example implementation of Stable Diffusion provider via Replicate API
 * Supports both sync polling and async webhooks
 */
@Injectable()
export class StableDiffusionProvider implements RendererProvider {
  name = 'stable-diffusion';
  private readonly logger = new Logger(StableDiffusionProvider.name);
  private apiKey: string = '';
  private webhookUrl: string = '';

  constructor(private readonly configService: ConfigService) {
    this.initializeConfig();
  }

  private async initializeConfig() {
    try {
      const config = await this.configService.getConfig('stable-diffusion');
      this.apiKey = config?.apiKey || '';
      this.webhookUrl = config?.webhookUrl || '';
      this.logger.log('Stable Diffusion provider initialized');
    } catch (err) {
      this.logger.warn('Failed to load Stable Diffusion config');
    }
  }

  canRender(type: 'image' | 'video'): boolean {
    // Stable Diffusion can only render images
    return type === 'image';
  }

  async render(jobId: string, input: RenderJobInput): Promise<{ providerJobId: string; estimatedTime?: number }> {
    if (!this.apiKey) {
      throw new Error('Stable Diffusion API key not configured');
    }

    try {
      const prompt = input.prompt || '';
      const negativePrompt = input.params?.negativePrompt || '';
      const width = input.params?.width || 512;
      const height = input.params?.height || 512;
      const steps = input.params?.steps || 25;
      const seed = input.params?.seed || Math.floor(Math.random() * 1000000);
      const guidance = input.params?.guidance || 7.5;

      // Call Replicate API to start render
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: 'e316348f51c32ddc5dbe0ff14ed14f0051e16af1427a3481c46a28dff0d28589', // Latest stable-diffusion-v1.5
          input: {
            prompt,
            negative_prompt: negativePrompt,
            width,
            height,
            num_inference_steps: steps,
            guidance_scale: guidance,
            seed,
          },
          webhook: this.webhookUrl ? `${this.webhookUrl}?jobId=${jobId}` : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Replicate API error: ${response.statusText}`);
      }

      const prediction = await response.json() as any;

      this.logger.log(`[render] Job submitted to Stable Diffusion`, {
        jobId,
        providerJobId: prediction.id,
        estimatedTime: 30, // seconds
      });

      return {
        providerJobId: prediction.id,
        estimatedTime: 30,
      };
    } catch (err: any) {
      this.logger.error(`[render] Failed to submit render`, {
        jobId,
        error: err.message,
      });
      throw err;
    }
  }

  async pollStatus(jobId: string, providerJobId: string): Promise<{ status: 'pending' | 'completed' | 'failed'; progress?: number; outputUrl?: string; error?: any }> {
    if (!this.apiKey) {
      throw new Error('Stable Diffusion API key not configured');
    }

    try {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${providerJobId}`, {
        headers: {
          'Authorization': `Token ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Replicate API error: ${response.statusText}`);
      }

      const prediction = await response.json() as any;

      // Map Replicate status to our status
      let status: 'pending' | 'completed' | 'failed' = 'pending';
      if (prediction.status === 'succeeded') {
        status = 'completed';
      } else if (prediction.status === 'failed' || prediction.status === 'canceled') {
        status = 'failed';
      }

      this.logger.log(`[pollStatus] Status check`, {
        jobId,
        providerJobId,
        status,
        replicateStatus: prediction.status,
      });

      return {
        status,
        outputUrl: prediction.output?.[0] || undefined,
        error: prediction.error ? { message: prediction.error } : undefined,
      };
    } catch (err: any) {
      this.logger.error(`[pollStatus] Poll failed`, {
        jobId,
        error: err.message,
      });
      throw err;
    }
  }

  async handleWebhook(payload: any): Promise<{ jobId: string; status: 'completed' | 'failed'; outputUrl?: string; error?: any }> {
    // payload should contain Replicate webhook + jobId
    const { prediction, jobId } = payload;
    const pred = prediction as any;

    this.logger.log(`[handleWebhook] Webhook received`, {
      jobId,
      status: pred.status,
    });

    if (pred.status === 'succeeded') {
      return {
        jobId,
        status: 'completed',
        outputUrl: pred.output?.[0],
      };
    } else if (pred.status === 'failed' || pred.status === 'canceled') {
      return {
        jobId,
        status: 'failed',
        error: { message: pred.error || 'Render failed' },
      };
    }

    throw new Error('Unexpected webhook status');
  }
}

/**
 * Example: Runway ML Provider (for video generation)
 */
@Injectable()
export class RunwayMLProvider implements RendererProvider {
  name = 'runway-ml';
  private readonly logger = new Logger(RunwayMLProvider.name);
  private apiKey: string = '';

  constructor(private readonly configService: ConfigService) {
    this.initializeConfig();
  }

  private async initializeConfig() {
    try {
      const config = await this.configService.getConfig('runway-ml');
      this.apiKey = config?.apiKey || '';
      this.logger.log('Runway ML provider initialized');
    } catch (err) {
      this.logger.warn('Failed to load Runway ML config');
    }
  }

  canRender(type: 'image' | 'video'): boolean {
    // Runway ML can render videos
    return type === 'video';
  }

  async render(jobId: string, input: RenderJobInput): Promise<{ providerJobId: string; estimatedTime?: number }> {
    if (!this.apiKey) {
      throw new Error('Runway ML API key not configured');
    }

    try {
      const prompt = input.prompt || '';
      const duration = input.params?.duration || 4; // seconds
      const model = input.model || 'gen2';

      // Call Runway API
      const response = await fetch('https://api.runwayml.com/v1/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskType: 'text2video',
          model,
          prompt,
          duration,
          resolution: '1280x720',
        }),
      });

      if (!response.ok) {
        throw new Error(`Runway API error: ${response.statusText}`);
      }

      const task = await response.json() as any;

      this.logger.log(`[render] Video job submitted to Runway ML`, {
        jobId,
        providerJobId: task.id,
        estimatedTime: 120, // seconds
      });

      return {
        providerJobId: task.id,
        estimatedTime: 120,
      };
    } catch (err: any) {
      this.logger.error(`[render] Failed to submit render`, {
        jobId,
        error: err.message,
      });
      throw err;
    }
  }

  async pollStatus(jobId: string, providerJobId: string): Promise<{ status: 'pending' | 'completed' | 'failed'; progress?: number; outputUrl?: string; error?: any }> {
    if (!this.apiKey) {
      throw new Error('Runway ML API key not configured');
    }

    try {
      const response = await fetch(`https://api.runwayml.com/v1/tasks/${providerJobId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Runway API error: ${response.statusText}`);
      }

      const task = await response.json() as any;

      let status: 'pending' | 'completed' | 'failed' = 'pending';
      if (task.status === 'SUCCEEDED') {
        status = 'completed';
      } else if (task.status === 'FAILED') {
        status = 'failed';
      }

      this.logger.log(`[pollStatus] Status check`, {
        jobId,
        status,
      });

      return {
        status,
        outputUrl: task.output?.url || undefined,
        error: task.error ? { message: task.error } : undefined,
      };
    } catch (err: any) {
      this.logger.error(`[pollStatus] Poll failed`, {
        error: err.message,
      });
      throw err;
    }
  }

  async handleWebhook(payload: any): Promise<{ jobId: string; status: 'completed' | 'failed'; outputUrl?: string; error?: any }> {
    const { task, jobId } = payload;
    const t = task as any;

    if (t.status === 'SUCCEEDED') {
      return {
        jobId,
        status: 'completed',
        outputUrl: t.output?.url,
      };
    } else if (t.status === 'FAILED') {
      return {
        jobId,
        status: 'failed',
        error: { message: t.error || 'Render failed' },
      };
    }

    throw new Error('Unexpected webhook status');
  }
}
