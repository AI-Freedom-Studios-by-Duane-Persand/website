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

      // Route to appropriate provider based on env config
      const imageProvider = process.env.IMAGE_PROVIDER || 'replicate';
      const videoProvider = process.env.VIDEO_PROVIDER || 'replicate';

      // Image generation - route to configured provider
      if (engineType === 'image-generation' || engineType === 'creative-image') {
        if (imageProvider === 'poe') {
          this.logger.info('Using Poe for image generation');
          const content = await this.poeClient.generateContent('image-generation', input);
          this.logger.info('Image generated successfully via Poe');
          return content;
        } else {
          this.logger.info('Using Replicate for image generation');
          return await this.generateImageWithReplicate(input);
        }
      }

      // Video generation - route to configured provider
      if (engineType === 'video-generation' || engineType === 'creative-video') {
        if (videoProvider === 'poe') {
          this.logger.info('Using Poe for video generation');
          const content = await this.poeClient.generateContent('video-generation', input);
          this.logger.info('Video generated successfully via Poe');
          return content;
        } else {
          this.logger.info('Using Replicate for video generation');
          return await this.generateVideoWithReplicate(input);
        }
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
      
      // Replicate API max is 1280x1280; preserve aspect ratio by scaling proportionally
      const initialWidth = parsed.width ?? parsed.quality?.width ?? 1280;
      const initialHeight = parsed.height ?? parsed.quality?.height ?? 720;
      const maxDim = 1280;
      
      let width = initialWidth;
      let height = initialHeight;
      
      // Scale down proportionally if either dimension exceeds maxDim
      if (initialWidth > maxDim || initialHeight > maxDim) {
        const scale = Math.min(maxDim / initialWidth, maxDim / initialHeight);
        width = Math.round(initialWidth * scale);
        height = Math.round(initialHeight * scale);
      }
      
      // Note: Flux Schnell doesn't support these parameters, so we extract them but don't pass to Replicate
      // const negativePrompt = parsed.negativePrompt || parsed.quality?.negativePrompt;
      // const numInferenceSteps = parsed.numInferenceSteps || parsed.quality?.numInferenceSteps;
      // const guidanceScale = parsed.guidanceScale || parsed.quality?.guidanceScale;
      // const scheduler = parsed.scheduler || parsed.quality?.scheduler;

      this.logger.info('[AIModelsService] Generating image with Replicate', {
        prompt: prompt.substring(0, 100),
        width,
        height,
      });

      // Pass only supported parameters for Flux Schnell
      return await this.replicateClient.generateImage(prompt, {
        width,
        height,
        // Flux Schnell ignores these, but don't pass them to avoid 422 errors
        // negativePrompt,
        // numInferenceSteps,
        // guidanceScale,
        // scheduler,
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

  /**
   * Get available models for a specific content type
   */
  getModelsForContentType(contentType: string) {
    // Combine Poe and Replicate popular models for unified selection
    const poeModels = this.poeClient.getModelsForContentType(contentType).map(m => ({
      model: m.model,
      displayName: m.displayName,
      provider: 'poe',
      recommended: m.recommended,
      description: m.description,
    }));

    const replicateModels = (() => {
      if (contentType === 'image-generation') {
        return [
          { model: 'sdxl', displayName: 'Stable Diffusion XL', provider: 'replicate', recommended: false, description: 'Advanced quality control via num steps & guidance' },
          { model: 'flux-schnell', displayName: 'Flux Schnell', provider: 'replicate', recommended: false, description: 'Fast generation with good results' },
        ];
      }
      if (contentType === 'video-generation') {
        return [
          { model: 'zeroscope', displayName: 'Zeroscope v2 XL', provider: 'replicate', recommended: true, description: 'Text-to-video generation with solid results' },
          { model: 'runway-gen2', displayName: 'Runway Gen-2', provider: 'replicate', recommended: false, description: 'Alternative text-to-video model' },
        ];
      }
      return [];
    })();

    const combined = [...poeModels, ...replicateModels];
    const recommendedModel = combined.find(m => m.recommended)?.model || combined[0]?.model;
    return { recommendedModel, availableModels: combined };
  }

  /**
   * Get all available models with their capabilities
   */
  getAllModelsWithCapabilities() {
    return this.poeClient.getAllModelsWithCapabilities();
  }

  /**
   * Validate if a model can handle a specific content type
   */
  canModelHandleContentType(model: string, contentType: string): boolean {
    return this.poeClient.canModelHandleContentType(model, contentType);
  }

  /**
   * Generate content with a specifically selected model
   */
  async generateContentWithModel(
    contentType: string,
    model: string,
    prompt: string,
    context?: any
  ): Promise<string> {
    try {
      // Validate model can handle this content type
      if (!this.canModelHandleContentType(model, contentType)) {
        this.logger.warn(`Model ${model} may not be ideal for ${contentType}, but attempting anyway`);
      }

      this.logger.info(`Generating ${contentType} with selected model: ${model}`, {
        promptLength: prompt.length,
        context,
      });

      const input = {
        model,
        contents: prompt,
      };

      // Route based on content type
      if (contentType === 'prompt-improvement') {
        return await this.poeClient.improvePrompt(prompt, context);
      }

      if (contentType === 'image-generation' || contentType === 'creative-image') {
        // If IMAGE_PROVIDER is poe, use Poe; otherwise use Replicate
        const imageProvider = process.env.IMAGE_PROVIDER || 'replicate';
        if (imageProvider === 'poe') {
          return await this.poeClient.generateContent('image-generation', input);
        } else {
          // Route to specific Replicate model when provided
          const parsed: any = (() => { try { return JSON.parse(input.contents); } catch { return {}; } })();
          const width = parsed.width ?? parsed.quality?.width;
          const height = parsed.height ?? parsed.quality?.height;
          const negativePrompt = parsed.negativePrompt ?? parsed.quality?.negativePrompt;
          const numInferenceSteps = parsed.numInferenceSteps ?? parsed.quality?.numInferenceSteps;
          const guidanceScale = parsed.guidanceScale ?? parsed.quality?.guidanceScale;
          const scheduler = parsed.scheduler ?? parsed.quality?.scheduler;

          if (model === 'sdxl' || model === 'flux-schnell') {
            return await this.replicateClient.generateImageWithModel(model as 'sdxl' | 'flux-schnell', prompt, {
              width,
              height,
              negativePrompt,
              numInferenceSteps,
              guidanceScale,
              scheduler,
            });
          }
          // Fallback to default behavior
          return await this.generateImageWithReplicate(input);
        }
      }

      if (contentType === 'video-generation' || contentType === 'creative-video') {
        const videoProvider = process.env.VIDEO_PROVIDER || 'replicate';
        if (videoProvider === 'poe') {
          return await this.poeClient.generateContent('video-generation', input);
        } else {
          const parsed: any = (() => { try { return JSON.parse(input.contents); } catch { return {}; } })();
          const durationSeconds = parsed.durationSeconds ?? parsed.duration ?? parsed.quality?.durationSeconds;
          const fps = parsed.fps ?? parsed.quality?.fps;
          const negativePrompt = parsed.negativePrompt ?? parsed.quality?.negativePrompt;
          const numInferenceSteps = parsed.numInferenceSteps ?? parsed.quality?.numInferenceSteps;
          const guidanceScale = parsed.guidanceScale ?? parsed.quality?.guidanceScale;

          if (model === 'zeroscope' || model === 'runway-gen2') {
            return await this.replicateClient.generateVideoWithModel(model as 'zeroscope' | 'runway-gen2', prompt, {
              durationSeconds,
              fps,
              negativePrompt,
              numInferenceSteps,
              guidanceScale,
            });
          }
          return await this.generateVideoWithReplicate(input);
        }
      }

      // For text-based content (captions, scripts, hashtags)
      return await this.poeClient.generateContent('creative-text', input);
    } catch (error) {
      this.logger.error(`Error generating ${contentType} with model ${model}`, {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }
}