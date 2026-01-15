/**
 * Poe Content Generator Adapter
 * 
 * Implements IContentGenerator interface for Poe API.
 * Provides content generation using Poe's AI models (Gemini, GPT, etc.)
 * 
 * Usage:
 * - Inject via NestJS DI
 * - Used by domain services (e.g., StrategyGenerationService)
 * - Can be swapped with other implementations (ReplicateContentGenerator, etc.)
 */

import { Injectable } from '@nestjs/common';
import { IContentGenerator, GenerateContentOptions, GeneratedContent } from '../../domain/ports/content-generator.interface';

/**
 * Poe API client type (adjust based on actual poe.client.ts interface)
 */
interface PoeClient {
  generateContent(prompt: string, model: string, options?: any): Promise<string>;
  generateContentStream(prompt: string, model: string, onChunk: (chunk: string) => void): Promise<string>;
  isModelAvailable(modelId: string): Promise<boolean>;
  getAvailableModels(): Promise<string[]>;
  estimateCost(contentType: string, prompt: string, model: string): Promise<number>;
}

/**
 * Poe Content Generator Adapter
 * Adapts Poe API to IContentGenerator interface
 */
@Injectable()
export class PoeContentGeneratorAdapter implements IContentGenerator {
  /**
   * Default model for text generation
   */
  private readonly DEFAULT_TEXT_MODEL = 'gpt-3.5-turbo';
  private readonly DEFAULT_IMAGE_MODEL = 'dall-e-3';
  private readonly DEFAULT_VIDEO_MODEL = 'runway';

  constructor(
    /**
     * Inject the actual Poe client from infrastructure layer
     * This assumes poe.client.ts exports a singleton service
     */
    private readonly poeClient: PoeClient,
  ) {}

  /**
   * Generate content using Poe API
   */
  async generate(options: GenerateContentOptions): Promise<GeneratedContent> {
    const model = options.model || this.getDefaultModel(options.contentType);
    const startTime = Date.now();

    try {
      // Validate model is available
      const isAvailable = await this.isModelAvailable(model);
      if (!isAvailable) {
        throw new Error(`Model ${model} is not available`);
      }

      // Build prompt with reference images if needed
      let enhancedPrompt = options.prompt;
      if (options.referenceImages && options.referenceImages.length > 0) {
        enhancedPrompt += `\n\nReference images: ${options.referenceImages.join(', ')}`;
      }

      // Call Poe API
      const content = await this.poeClient.generateContent(
        enhancedPrompt,
        model,
        {
          metadata: options.metadata,
          provider: 'poe',
        },
      );

      const duration = Date.now() - startTime;

      return {
        content,
        type: options.contentType,
        model,
        provider: 'poe',
        generatedAt: new Date(),
        duration,
        usage: {
          inputTokens: 0, // Would need actual token counting
          outputTokens: 0,
        },
      };
    } catch (error) {
      throw new Error(`Poe content generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate content with streaming (for long-running operations)
   */
  async generateStream(
    options: GenerateContentOptions,
    onChunk: (chunk: string) => void,
  ): Promise<GeneratedContent> {
    const model = options.model || this.getDefaultModel(options.contentType);
    const startTime = Date.now();

    try {
      const isAvailable = await this.isModelAvailable(model);
      if (!isAvailable) {
        throw new Error(`Model ${model} is not available`);
      }

      let enhancedPrompt = options.prompt;
      if (options.referenceImages && options.referenceImages.length > 0) {
        enhancedPrompt += `\n\nReference images: ${options.referenceImages.join(', ')}`;
      }

      // Stream content generation
      let fullContent = '';
      const wrappedOnChunk = (chunk: string) => {
        fullContent += chunk;
        onChunk(chunk);
      };

      await this.poeClient.generateContentStream(
        enhancedPrompt,
        model,
        wrappedOnChunk,
      );

      const duration = Date.now() - startTime;

      return {
        content: fullContent,
        type: options.contentType,
        model,
        provider: 'poe',
        generatedAt: new Date(),
        duration,
        usage: {
          inputTokens: 0,
          outputTokens: 0,
        },
      };
    } catch (error) {
      throw new Error(`Poe stream generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if a model is available
   */
  async isModelAvailable(modelId: string): Promise<boolean> {
    try {
      return await this.poeClient.isModelAvailable(modelId);
    } catch {
      return false;
    }
  }

  /**
   * Get available models by content type
   */
  async getAvailableModels(contentType: 'text' | 'image' | 'video'): Promise<string[]> {
    try {
      const allModels = await this.poeClient.getAvailableModels();
      
      // Filter models by type (in real implementation, would have metadata)
      return allModels.filter((model) => {
        switch (contentType) {
          case 'image':
            return model.includes('dall-e') || model.includes('image');
          case 'video':
            return model.includes('runway') || model.includes('video');
          case 'text':
          default:
            return !model.includes('dall-e') && !model.includes('runway');
        }
      });
    } catch {
      return this.getDefaultModels(contentType);
    }
  }

  /**
   * Estimate cost of content generation
   */
  async estimateCost(options: GenerateContentOptions): Promise<number> {
    try {
      const model = options.model || this.getDefaultModel(options.contentType);
      return await this.poeClient.estimateCost(options.contentType, options.prompt, model);
    } catch {
      // Return fallback estimate
      return this.getFallbackCost(options.contentType, options.prompt.length);
    }
  }

  /**
   * Get default model for content type
   */
  private getDefaultModel(contentType: string): string {
    switch (contentType) {
      case 'image':
        return this.DEFAULT_IMAGE_MODEL;
      case 'video':
        return this.DEFAULT_VIDEO_MODEL;
      case 'text':
      default:
        return this.DEFAULT_TEXT_MODEL;
    }
  }

  /**
   * Get default available models for content type
   */
  private getDefaultModels(contentType: 'text' | 'image' | 'video'): string[] {
    switch (contentType) {
      case 'image':
        return ['dall-e-3', 'dall-e-2'];
      case 'video':
        return ['runway-gen2', 'runway-gen3'];
      case 'text':
      default:
        return ['gpt-3.5-turbo', 'gpt-4', 'claude-3-opus'];
    }
  }

  /**
   * Get fallback cost estimate (in USD cents)
   */
  private getFallbackCost(contentType: string, promptLength: number): number {
    const baseCost = {
      text: 0.5, // 0.5 cents per 1000 chars
      image: 20, // 20 cents per image
      video: 100, // 100 cents per video
    };

    const type = contentType as keyof typeof baseCost;
    const cost = baseCost[type] || 1;

    // Adjust for prompt length (text only)
    if (contentType === 'text') {
      return Math.round(cost * (promptLength / 1000));
    }

    return cost;
  }
}
