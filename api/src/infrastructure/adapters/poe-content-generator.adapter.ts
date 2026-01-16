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
import { PoeClient } from '../../engines/poe.client';

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
      // Map content type to engine type
      const engineType = this.mapContentTypeToEngineType(options.contentType);

      // Build input with prompt and metadata
      const input = {
        model,
        contents: JSON.stringify({
          prompt: options.prompt,
          ...options.metadata,
        }),
      };

      // Call Poe API
      const content = await this.poeClient.generateContent(engineType, input);

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
   * Map content type to Poe engine type
   */
  private mapContentTypeToEngineType(contentType: string): string {
    switch (contentType) {
      case 'text':
        return 'creative-text';
      case 'image':
        return 'image-generation';
      case 'video':
        return 'video-generation';
      default:
        return 'creative-text';
    }
  }

  /**
   * Generate content with streaming (stub implementation)
   */
  async generateStream(
    options: GenerateContentOptions,
    onChunk: (chunk: string) => void,
  ): Promise<GeneratedContent> {
    // Fallback to non-streaming for now
    const result = await this.generate(options);
    onChunk(result.content);
    return result;
  }

  /**
   * Check if model is available (stub implementation)
   */
  async isModelAvailable(modelId: string): Promise<boolean> {
    // For now, assume all models are available
    return true;
  }

  /**
   * Get available models by content type (stub implementation)
   */
  async getAvailableModels(contentType: 'text' | 'image' | 'video'): Promise<string[]> {
    switch (contentType) {
      case 'image':
        return ['dall-e-3', 'nano-banana'];
      case 'video':
        return ['Video-Generator-PRO', 'veo-3'];
      case 'text':
      default:
        return ['gpt-4o', 'gpt-3.5-turbo', 'claude-3-opus-20240229'];
    }
  }

  /**
   * Estimate cost (stub implementation)
   */
  async estimateCost(options: GenerateContentOptions): Promise<number> {
    // Stub: return base cost estimates
    switch (options.contentType) {
      case 'image':
        return 20; // 20 cents
      case 'video':
        return 100; // 100 cents
      case 'text':
      default:
        return 1; // 1 cent
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
}
