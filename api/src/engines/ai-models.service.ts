import { Injectable, Inject } from '@nestjs/common';
import { Logger } from 'winston';
import { PoeClient } from './poe.client';
import { ReplicateClient } from './replicate.client';

@Injectable()
export class AIModelsService {
  private readonly logger: Logger;

  private readonly models = [
    { name: 'GPT-4o', description: "OpenAI's latest model" },
    { name: 'Claude-Sonnet-4', description: "Anthropic's most capable model" },
    { name: 'Gemini-2.5-Pro', description: "Google's flagship model" },
    { name: 'Llama-3.1-405B', description: "Meta's largest open-source model" },
    { name: 'Grok-4', description: "xAI's latest model" },
    { name: 'Veo-3', description: "Google's latest model for video generation" },
  ];

  constructor(
    private readonly poeClient: PoeClient,
    private readonly replicateClient: ReplicateClient,
    @Inject('winston') logger: Logger
  ) {
    this.logger = logger.child({ context: AIModelsService.name });
  }

  getAvailableModels() {
    return this.models;
  }

  async listModels(): Promise<{ id: string; name: string }[]> {
    try {
      this.logger.info('Fetching AI models from Poe API');
      const models = await this.poeClient.listModels();

      // Map models to id-name pairs
      const aiModels = models.map((model) => ({ id: model, name: model }));

      this.logger.info('AI models fetched successfully', { count: aiModels.length });
      return aiModels;
    } catch (error) {
      this.logger.error('Error fetching AI models', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error('Failed to fetch AI models. Please try again later.');
    }
  }

  async generateContent(engineType: string, input: { model: string; contents: string }): Promise<string> {
    try {
      this.logger.info(`Generating content using engine: ${engineType}`, { input });

      // Use Replicate for image and video generation
      if (engineType === 'image-generation' || engineType === 'creative-image') {
        return await this.generateImageWithReplicate(input);
      }

      if (engineType === 'video-generation' || engineType === 'creative-video') {
        return await this.generateVideoWithReplicate(input);
      }

      // Use Poe for text generation
      const content = await this.poeClient.generateContent(engineType, input);

      this.logger.info('Content generated successfully');
      return content;
    } catch (error) {
      const status = (error as any)?.status;
      const recoverable = status === 402 || status === 429 || status === 503;

      if (recoverable) {
        this.logger.warn('Falling back to template content after API error', {
          engineType,
          status,
        });
        return this.buildFallback(engineType, input);
      }

      this.logger.error('Error generating content', {
        error: error instanceof Error ? error.message : error,
        status,
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      // Use fallback for any generation error to ensure UX doesn't break
      this.logger.info('Using fallback response due to generation error');
      return this.buildFallback(engineType, input);
    }
  }

  /**
   * Generate image using Replicate
   */
  private async generateImageWithReplicate(input: { model: string; contents: string }): Promise<string> {
    try {
      let parsed: any = {};
      try {
        parsed = JSON.parse(input.contents);
      } catch {}

      const prompt = parsed.prompt || input.contents;
      const width = parsed.width || parsed.quality?.width || 1280;
      const height = parsed.height || parsed.quality?.height || 720;
      const negativePrompt = parsed.negativePrompt || parsed.quality?.negativePrompt;
      const numInferenceSteps = parsed.numInferenceSteps || parsed.quality?.numInferenceSteps;
      const guidanceScale = parsed.guidanceScale || parsed.quality?.guidanceScale;
      const scheduler = parsed.scheduler || parsed.quality?.scheduler;

      this.logger.info('[AIModelsService] Generating image with Replicate', {
        prompt: prompt.substring(0, 100),
        width,
        height,
        numInferenceSteps,
        guidanceScale,
      });

      return await this.replicateClient.generateImage(prompt, {
        width,
        height,
        negativePrompt,
        numInferenceSteps,
        guidanceScale,
        scheduler,
      });
    } catch (error) {
      this.logger.error('[AIModelsService] Replicate image generation failed', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Generate video using Replicate
   */
  private async generateVideoWithReplicate(input: { model: string; contents: string }): Promise<string> {
    try {
      let parsed: any = {};
      try {
        parsed = JSON.parse(input.contents);
      } catch {}

      const prompt = parsed.prompt || input.contents;
      const durationSeconds = parsed.durationSeconds || parsed.duration || parsed.quality?.durationSeconds || 8;
      const fps = parsed.fps || parsed.quality?.fps || 24;
      const negativePrompt = parsed.negativePrompt || parsed.quality?.negativePrompt;
      const numInferenceSteps = parsed.numInferenceSteps || parsed.quality?.numInferenceSteps;
      const guidanceScale = parsed.guidanceScale || parsed.quality?.guidanceScale;

      this.logger.info('[AIModelsService] Generating video with Replicate', {
        prompt: prompt.substring(0, 100),
        durationSeconds,
        fps,
        numInferenceSteps,
        guidanceScale,
      });

      return await this.replicateClient.generateVideo(prompt, {
        durationSeconds,
        fps,
        negativePrompt,
        numInferenceSteps,
        guidanceScale,
      });
    } catch (error) {
      this.logger.error('[AIModelsService] Replicate video generation failed', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  private buildFallback(engineType: string, input: { model: string; contents: string }): string {
    let parsed: any = {};
    try {
      parsed = JSON.parse(input.contents);
    } catch {}

    const prompt = parsed.prompt || parsed.task || 'your campaign';

    if (engineType === 'creative-text') {
      return JSON.stringify({
        caption: `Draft caption for ${prompt}.`,
        hashtags: ['#draft', '#placeholder'],
      });
    }

    if (engineType === 'creative-image') {
      return `Image concept: ${prompt} with brand-consistent colors and clean layout.`;
    }

    if (engineType === 'creative-video') {
      return JSON.stringify({
        hook: `Quick intro about ${prompt}.`,
        body: [
          'Highlight the main value prop.',
          'Show one proof point or stat.',
          'End with a simple call to action.',
        ],
        outro: 'CTA: Learn more at your site.',
      });
    }

    return 'Fallback content generated locally.';
  }
}