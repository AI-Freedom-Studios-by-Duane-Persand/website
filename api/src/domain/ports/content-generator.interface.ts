/**
 * Content Generator Port Interface
 * 
 * Defines the contract for content generation services (text, image, video).
 * This abstraction allows swapping implementations (Poe, Replicate, etc.)
 * without affecting domain logic.
 * 
 * Port Pattern (Hexagonal Architecture):
 * - Domain depends on port interface
 * - Infrastructure implements port interface
 * - Framework injects implementation via DI
 */

export interface GenerateContentOptions {
  /** Content prompt or instruction */
  prompt: string;
  
  /** Model identifier (e.g., 'gpt-4o', 'nano-banana', 'google/veo-3.1') */
  model?: string;
  
  /** Content type being generated */
  contentType: 'text' | 'image' | 'video';
  
  /** Provider preference (poe, replicate, etc.) */
  provider?: string;
  
  /** Reference images for image generation */
  referenceImages?: string[];
  
  /** Duration in seconds (for video) */
  duration?: number;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

export interface GeneratedContent {
  /** Generated content URL or text */
  content: string;
  
  /** Content type */
  type: 'text' | 'image' | 'video' | 'audio';
  
  /** Model used */
  model: string;
  
  /** Provider used */
  provider: string;
  
  /** Generation timestamp */
  generatedAt: Date;
  
  /** Generation duration in milliseconds */
  duration: number;
  
  /** Usage metrics (tokens, credits, etc.) */
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    credits?: number;
  };
}

export interface IContentGenerator {
  /**
   * Generate content (text, image, or video)
   * 
   * @param options Generation options
   * @returns Generated content with metadata
   */
  generate(options: GenerateContentOptions): Promise<GeneratedContent>;

  /**
   * Generate content with streaming support
   * 
   * @param options Generation options
   * @param onChunk Callback for each streamed chunk
   * @returns Generated content with metadata
   */
  generateStream(
    options: GenerateContentOptions,
    onChunk: (chunk: string) => void
  ): Promise<GeneratedContent>;

  /**
   * Check if model is available
   * 
   * @param modelId Model identifier
   * @returns True if model is available
   */
  isModelAvailable(modelId: string): Promise<boolean>;

  /**
   * Get available models for a content type
   * 
   * @param contentType Content type
   * @returns List of available models
   */
  getAvailableModels(contentType: 'text' | 'image' | 'video'): Promise<string[]>;

  /**
   * Estimate generation cost
   * 
   * @param options Generation options
   * @returns Estimated cost (in provider's currency/units)
   */
  estimateCost(options: GenerateContentOptions): Promise<number>;
}
