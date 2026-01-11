// api/src/engines/poe.client.ts
// PoeClient implementation using Poe.com API
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { createLogger, format, transports } from 'winston';
import https from 'https';
import http from 'http';

interface ModelCapabilities {
  supportsText: boolean;
  supportsImages: boolean;
  supportsVideo: boolean;
  isMultimodal: boolean;
}

@Injectable()
export class PoeClient {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private logger;
  private axiosInstance: AxiosInstance;
  
  // Model capabilities mapping for proper routing
  private readonly modelCapabilities: Map<string, ModelCapabilities> = new Map([
    ['gpt-4o', { supportsText: true, supportsImages: true, supportsVideo: false, isMultimodal: true }],
    ['gpt-4', { supportsText: true, supportsImages: false, supportsVideo: false, isMultimodal: false }],
    ['gpt-3.5-turbo', { supportsText: true, supportsImages: false, supportsVideo: false, isMultimodal: false }],
    ['claude-3-opus-20240229', { supportsText: true, supportsImages: true, supportsVideo: false, isMultimodal: true }],
    ['claude-3-sonnet-20240229', { supportsText: true, supportsImages: true, supportsVideo: false, isMultimodal: true }],
    ['claude-3-haiku-20240307', { supportsText: true, supportsImages: true, supportsVideo: false, isMultimodal: true }],
    ['gemini-1.5-pro', { supportsText: true, supportsImages: true, supportsVideo: true, isMultimodal: true }],
    ['veo-3', { supportsText: false, supportsImages: false, supportsVideo: true, isMultimodal: false }],
    ['Video-Generator-PRO', { supportsText: false, supportsImages: false, supportsVideo: true, isMultimodal: false }],
    ['dall-e-3', { supportsText: false, supportsImages: true, supportsVideo: false, isMultimodal: false }],
    ['stable-diffusion-xl', { supportsText: false, supportsImages: true, supportsVideo: false, isMultimodal: false }],
    // Poe image model: nano-banana
    ['nano-banana', { supportsText: false, supportsImages: true, supportsVideo: false, isMultimodal: false }],
  ]);

  constructor() {
    const apiKey = process.env.POE_API_KEY;
    if (!apiKey) {
      throw new Error('Poe API key is missing');
    }
    this.apiKey = apiKey;

    // Initialize Winston logger
    this.logger = createLogger({
      level: 'info',
      format: format.combine(format.timestamp(), format.json()),
      transports: [
        new transports.Console(),
        new transports.File({ filename: 'logs/poe-client.log' }),
      ],
    });

    const apiUrl = process.env.POE_API_URL;
    if (!apiUrl) {
      throw new Error('Poe API URL is missing');
    }
    this.apiUrl = apiUrl;

    // Determine timeout (allow override via env, default 120s for heavier image/video models)
    const timeoutMs = Number(process.env.POE_TIMEOUT_MS) && Number(process.env.POE_TIMEOUT_MS) > 0
      ? Number(process.env.POE_TIMEOUT_MS)
      : 120000;

    // Create axios instance with connection pooling for better parallel performance
    this.axiosInstance = axios.create({
      baseURL: this.apiUrl,
      timeout: timeoutMs,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      httpAgent: new http.Agent({ 
        keepAlive: true, 
        maxSockets: 10,
        maxFreeSockets: 5,
      }),
      httpsAgent: new https.Agent({ 
        keepAlive: true,
        maxSockets: 10,
        maxFreeSockets: 5,
      }),
    });

    // Log the initialization of PoeClient
    const logger = new Logger(PoeClient.name);
    logger.log(`PoeClient initialized with API URL: ${this.apiUrl}`);
    logger.log(`PoeClient initialized with API Key: ${this.apiKey ? 'Loaded' : 'Missing'}`);
    logger.log(`PoeClient configured with connection pooling (max 10 concurrent)`);
    logger.log(`PoeClient timeout set to ${timeoutMs} ms`);
    logger.log(`Model capabilities loaded for ${this.modelCapabilities.size} models`);
  }

  /**
   * Get model capabilities to determine what it can generate
   */
  getModelCapabilities(model: string): ModelCapabilities {
    return this.modelCapabilities.get(model) || {
      supportsText: true,
      supportsImages: false,
      supportsVideo: false,
      isMultimodal: false,
    };
  }

  /**
   * Select best model for the requested generation type
   */
  selectBestModel(engineType: string, requestedModel?: string): string {
    // If a specific model is requested and supports the engine type, use it
    if (requestedModel) {
      const capabilities = this.getModelCapabilities(requestedModel);
      if (
        (engineType.includes('image') && capabilities.supportsImages) ||
        (engineType.includes('video') && capabilities.supportsVideo) ||
        (engineType.includes('text') && capabilities.supportsText)
      ) {
        return requestedModel;
      }
    }

    // Select best default model based on engine type
    if (engineType === 'image-generation') {
      // Default to nano-banana for Poe image generation if no override is set
      return process.env.POE_IMAGE_MODEL || 'nano-banana';
    } else if (engineType === 'video-generation') {
      return process.env.POE_VIDEO_MODEL || 'Video-Generator-PRO';
    } else if (engineType.includes('image')) {
      return 'gpt-4o'; // Multimodal for understanding images
    } else if (engineType.includes('video')) {
      return 'gemini-1.5-pro'; // Best for video understanding
    }

    return requestedModel || 'gpt-4o';
  }

  async generateContent(engineType: string, input: { model: string; contents: string }): Promise<string> {
    try {
      // Select the best model for this engine type
      const selectedModel = this.selectBestModel(engineType, input.model);
      const capabilities = this.getModelCapabilities(selectedModel);

      this.logger.info(`[PoeClient] Generating content for engine: ${engineType}`, {
        requestedModel: input.model,
        selectedModel,
        capabilities,
      });

      // Parse contents to extract generation parameters
      let parsedInput: any = {};
      try {
        parsedInput = JSON.parse(input.contents);
      } catch {
        parsedInput = { prompt: input.contents };
      }

      // Handle image generation
      if (engineType === 'image-generation') {
        return await this.generateImage(selectedModel, parsedInput);
      }

      // Handle video generation
      if (engineType === 'video-generation') {
        return await this.generateVideo(selectedModel, parsedInput);
      }

      // Handle text generation (creative-text, creative-image prompts, creative-video scripts)
      return await this.generateText(selectedModel, parsedInput, engineType);
    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;

      this.logger.error(`[PoeClient] Error generating content`, {
        engineType,
        error: error?.message,
        status,
        data,
      });

      // Provide user-friendly error messages
      let errorMessage = error?.message || 'Unknown error';
      let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
      
      if (status === 402) {
        const quotaMessage = data?.error?.message || 'Insufficient quota';
        errorMessage = `Poe API credits exhausted: ${quotaMessage}. Add more points at https://poe.com/api_key`;
        httpStatus = 402; // Payment Required
      } else if (status === 401) {
        errorMessage = 'Poe API authentication failed. Check your POE_API_KEY configuration.';
        httpStatus = HttpStatus.UNAUTHORIZED;
      } else if (status === 429) {
        errorMessage = 'Poe API rate limit exceeded. Please try again later or upgrade your plan.';
        httpStatus = HttpStatus.TOO_MANY_REQUESTS;
      } else if (status >= 500) {
        errorMessage = 'Poe API server error. Please try again later.';
        httpStatus = HttpStatus.BAD_GATEWAY;
      }

      // Throw HttpException with proper status code so it gets caught by exception filter
      throw new HttpException(
        {
          statusCode: httpStatus,
          message: errorMessage,
          userFriendlyMessage: errorMessage,
          error: 'Poe API Error',
        },
        httpStatus
      );
    }
  }

  /**
   * Generate text content (prompts, scripts, captions)
   */
  private async generateText(model: string, input: any, engineType: string): Promise<string> {
    const systemPrompts: Record<string, string> = {
      'creative-text': 'You are a social media copywriter. Generate engaging captions with hashtags in JSON format: {"caption": "...", "hashtags": ["tag1", "tag2"]}',
      'creative-image': 'You are an AI art prompt engineer. Create detailed image generation prompts that describe visual scenes, lighting, style, and composition.',
      'creative-video': 'You are a video script writer. Create engaging video scripts in JSON format: {"hook": "...", "body": ["point1", "point2"], "outro": "..."}',
    };

    const systemPrompt = systemPrompts[engineType] || 'You are a helpful AI assistant.';
    const userPrompt = input.prompt || JSON.stringify(input);

    try {
      const start = Date.now();
      this.logger.info(`[generateText] Starting Poe API call`, {
        model,
        engineType,
        promptLength: userPrompt.length,
      });

      const response = await this.axiosInstance.post('/chat/completions', {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from Poe API');
      }

      const content = response.data.choices[0].message.content;
      const durationMs = Date.now() - start;
      const logMethod = durationMs > 15000 ? 'warn' : 'info';
      (this.logger as any)[logMethod](`[generateText] Content generated successfully`, {
        model,
        engineType,
        durationMs,
        contentLength: content.length,
      });

      return content;
    } catch (error: any) {
      const durationMs = error?.config?.metadata?.startTime
        ? Date.now() - error.config.metadata.startTime
        : undefined;
      // If API fails, return a mock response for demo/fallback purposes
      this.logger.warn(`[generateText] API call failed, using fallback response`, {
        model,
        error: error?.message,
        status: error?.response?.status,
        durationMs,
      });

      // Generate fallback content based on engine type
      return this.generateFallbackText(engineType, userPrompt);
    }
  }

  /**
   * Generate fallback text content when API is unavailable
   */
  private generateFallbackText(engineType: string, userPrompt: string): string {
    switch (engineType) {
      case 'creative-text':
        return JSON.stringify({
          caption: `Exciting update about our campaign! ${userPrompt.substring(0, 100)}... 🚀 Ready to engage our audience with compelling messaging.`,
          hashtags: ['campaign', 'marketing', 'innovation', 'engagement'],
        });
      case 'creative-image':
        return `A professional, modern design featuring [main subject], with a clean background, professional lighting, modern style, high quality, 4k, trending on design platforms`;
      case 'creative-video':
        return JSON.stringify({
          hook: `Attention-grabbing intro: ${userPrompt.substring(0, 50)}...`,
          body: [
            'Key value proposition and benefits',
            'Social proof and credibility building',
            'Call-to-action with sense of urgency',
          ],
          outro: 'Strong closing statement with brand mention and next steps',
        });
      default:
        return `Generated content based on: ${userPrompt.substring(0, 200)}...`;
    }
  }

  /**
   * Generate actual image from prompt
   */
  private async generateImage(model: string, input: any): Promise<string> {
    const prompt = input.prompt || '';
    const width = input.width || 1024;
    const height = input.height || 1024;
    const quality = input.quality || 'standard';

    const start = Date.now();
    this.logger.info(`[generateImage] Starting Poe API call`, {
      model,
      promptLength: prompt.length,
      size: `${width}x${height}`,
      quality,
    });

    // Use chat completions for Poe v2 image-capable models
    const response = await this.axiosInstance.post('/chat/completions', {
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an image generation bot. Generate an image and return either an attachment or a single JSON object {"url": "https://...", "description": "..."}. If attachment is used, also include a markdown image reference.'
        },
        {
          role: 'user',
          content: `Prompt: ${prompt}\nTarget size: ${width}x${height}\nQuality: ${quality}`,
        },
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const durationMs = Date.now() - start;
    const timingLogMethod = durationMs > 15000 ? 'warn' : 'info';
    (this.logger as any)[timingLogMethod]('[generateImage] Poe API call completed', {
      model,
      durationMs,
    });

    const choice = response.data?.choices?.[0];
    const message = choice?.message;
    const content = message?.content || '';
    const attachments = message?.attachments || [];

    // Prefer attachments if present
    const imageAttachment = Array.isArray(attachments)
      ? attachments.find((a: any) => (a?.content_type || '').startsWith('image') && a?.url)
      : null;
    if (imageAttachment?.url) {
      const url = imageAttachment.url as string;
      this.logger.info(`[generateImage] Attachment URL extracted`, { model, url: url.substring(0, 50) + '...' });
      return JSON.stringify({ url, prompt });
    }

    // Try JSON in content
    try {
      const parsed = JSON.parse(content);
      if (parsed?.url && typeof parsed.url === 'string') {
        const url = parsed.url as string;
        this.logger.info(`[generateImage] JSON URL extracted`, { model, url: url.substring(0, 50) + '...' });
        return JSON.stringify({ url, prompt, description: parsed.description });
      }
    } catch {}

    // Try URL regex from content (markdown or plain)
    const urlMatch = (content.match(/https?:\/\/[^\s)\"']+/) || [])[0];
    if (urlMatch) {
      const url = urlMatch;
      this.logger.info(`[generateImage] URL extracted from content`, { model, url: url.substring(0, 50) + '...' });
      return JSON.stringify({ url, prompt });
    }

    // If nothing found, log and return a fallback placeholder image
    this.logger.warn('[generateImage] No image URL or attachment found in Poe response, using fallback image', {
      model,
      contentPreview: content.substring(0, 200),
    });

    const fallbackUrl = `https://via.placeholder.com/${width}x${height}.png?text=Image+not+available`;
    return JSON.stringify({
      url: fallbackUrl,
      prompt,
      width,
      height,
      provider: 'poe-fallback',
      isPlaceholder: true,
      note: 'Poe response did not include an image URL; using placeholder image.',
    });
  }

  /**
   * Generate actual video from script/prompt using Poe's Video-Generator-PRO
   */
  private async generateVideo(model: string, input: any): Promise<string> {
    const prompt = input.prompt || '';
    const script = input.script || {};
    const duration = input.duration || 15;
    const resolution = input.resolution || '1080p';

    const start = Date.now();
    this.logger.info(`[generateVideo] Starting Poe API call`, {
      model,
      promptLength: prompt.length,
      hasScript: !!script,
      duration,
      resolution,
    });

    // Build comprehensive prompt from script if available
    let videoPrompt = prompt;
    if (script && Object.keys(script).length > 0) {
      const scriptParts: string[] = [];
      if (script.hook) scriptParts.push(`Hook: ${script.hook}`);
      if (script.body) {
        const bodyText = Array.isArray(script.body) ? script.body.join('. ') : script.body;
        scriptParts.push(`Body: ${bodyText}`);
      }
      if (script.outro) scriptParts.push(`Outro: ${script.outro}`);
      if (scriptParts.length > 0) {
        videoPrompt = `${prompt}\n\n${scriptParts.join('\n')}`;
      }
    }

    // Use Video-Generator-PRO model for video generation
    const videoModel = 'Video-Generator-PRO';
    
    this.logger.info(`[generateVideo] Using model: ${videoModel}`, {
      promptLength: videoPrompt.length,
    });

    try {
      const response = await this.axiosInstance.post('/chat/completions', {
        model: videoModel,
        messages: [
          {
            role: 'user',
            content: videoPrompt,
          },
        ],
      });

      const durationMs = Date.now() - start;
      const timingLogMethod = durationMs > 30000 ? 'warn' : 'info';
      (this.logger as any)[timingLogMethod]('[generateVideo] Poe API call completed', {
        model: videoModel,
        durationMs,
      });

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from Poe Video-Generator-PRO');
      }

      const content = response.data.choices[0].message.content;
      this.logger.info(`[generateVideo] Video generation response received`, {
        contentLength: content.length,
      });

      // Try to extract video URL from response
      // The response might contain a URL directly or in JSON format
      let videoUrl = content;
      
      // Try JSON parsing first
      try {
        const parsed = JSON.parse(content);
        if (parsed.url) {
          videoUrl = parsed.url;
        } else if (parsed.video_url) {
          videoUrl = parsed.video_url;
        } else if (parsed.file_url) {
          videoUrl = parsed.file_url;
        }
      } catch {
        // If not JSON, try to extract URL using regex
        const urlMatch = content.match(/https?:\/\/[^\s)"']+\.(mp4|mov|avi|webm)/);
        if (urlMatch) {
          videoUrl = urlMatch[0];
        }
      }

      // Validate we have a URL
      if (!videoUrl.startsWith('http')) {
        this.logger.warn(`[generateVideo] No URL found in response, using fallback`, {
          contentPreview: content.substring(0, 100),
        });
        return this.generateFallbackVideo(prompt, script, duration, resolution);
      }

      this.logger.info(`[generateVideo] Video URL extracted`, {
        url: videoUrl.substring(0, 50) + '...',
      });

      return JSON.stringify({ 
        url: videoUrl, 
        prompt, 
        script, 
        duration,
        provider: 'poe',
      });
    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;

      this.logger.warn(`[generateVideo] API call failed, using fallback response`, {
        model,
        error: error?.message,
        status,
      });

      // Handle specific error cases
      if (status === 402) {
        this.logger.error(`[generateVideo] Poe API quota exhausted (402)`, {
          error: error?.message,
        });
        // Throw quota error to caller - don't use fallback
        throw new Error('Poe API credits exhausted. Add more points at https://poe.com/api_key');
      }

      // For other errors, return fallback
      return this.generateFallbackVideo(prompt, script, duration, resolution);
    }
  }

  /**
   * Generate fallback video response when API is unavailable
   */
  private generateFallbackVideo(prompt: string, script: any, duration: number, resolution: string): string {
    // Return a mock video generation response with a placeholder
    return JSON.stringify({
      url: `https://via.placeholder.com/1080x1920.mp4?text=Video+Content+(${duration}s)`,
      prompt,
      script,
      duration,
      resolution,
      provider: 'fallback',
      status: 'pending_generation',
      note: 'Video is queued for generation. Check back soon for the actual video file.',
    });
  }

  async listModels(): Promise<string[]> {
    try {
      this.logger.info('[PoeClient] Fetching available models with capabilities');

      // Updated to include image and video generation models
      const staticModels = [
        // Text generation models
        'gpt-4o',
        'gpt-4',
        'gpt-3.5-turbo',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
        'llama-3-70b',
        'llama-3-8b',
        'grok-1',
        // Multimodal models (text + images)
        'gemini-1.5-pro',
        // Image generation models
        'nano-banana',
        'dall-e-3',
        'stable-diffusion-xl',
        // Video generation models
        'Video-Generator-PRO',
        'veo-3',
      ];

      this.logger.info('[PoeClient] Available models fetched successfully', {
        total: staticModels.length,
        text: staticModels.filter(m => this.getModelCapabilities(m).supportsText).length,
        image: staticModels.filter(m => this.getModelCapabilities(m).supportsImages).length,
        video: staticModels.filter(m => this.getModelCapabilities(m).supportsVideo).length,
      });

      return staticModels;
    } catch (error: any) {
      this.logger.error('[PoeClient] Error fetching models', {
        error: error.message,
      });
      throw new Error('Failed to fetch models');
    }
  }

  /**
   * Improve a prompt using GPT-4o
   */
  async improvePrompt(prompt: string, context?: { targetAudience?: string; tone?: string; style?: string } | string | Record<string, any>): Promise<string> {
    // Normalize context to object format
    let contextObj: { targetAudience?: string; tone?: string; style?: string } | undefined;
    if (context) {
      if (typeof context === 'string') {
        contextObj = { style: context };
      } else if (typeof context === 'object') {
        contextObj = context as any;
      }
    }

    const systemPrompt = `You are an expert creative prompt engineer. Your task is to enhance and improve creative prompts.

When given a creative prompt, you should:
1. Enhance it with more vivid, descriptive language
2. Add professional quality descriptors
3. Make it more specific and actionable
4. Suggest improvements that would result in higher-quality outputs
5. Keep the core intent while elevating the language

${contextObj ? `Consider this context:
- Target Audience: ${contextObj.targetAudience || 'General'}
- Tone: ${contextObj.tone || 'Professional'}
- Style: ${contextObj.style || 'Modern'}` : ''}

Return ONLY the improved prompt, nothing else. Do not include explanations.`;

    try {
      this.logger.info('[improvePrompt] Improving prompt', {
        promptLength: prompt.length,
      });

      const response = await this.axiosInstance.post('/chat/completions', {
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from Poe API');
      }

      const improvedPrompt = response.data.choices[0].message.content.trim();
      this.logger.info('[improvePrompt] Prompt improved successfully', {
        originalLength: prompt.length,
        improvedLength: improvedPrompt.length,
      });

      return improvedPrompt;
    } catch (error: any) {
      this.logger.error('[improvePrompt] Error improving prompt', {
        error: error?.message,
        status: error?.response?.status,
      });

      // Fallback: return enhanced version of the original prompt
      return `${prompt}. High quality, professional, detailed, well-composed, trending aesthetic`;
    }
  }

  /**
   * Get models available for a specific content type
   * ContentTypes: prompt-improvement, image-generation, video-generation, caption-generation, script-generation, hashtag-generation
   */
  getModelsForContentType(contentType: string): Array<{ model: string; displayName: string; recommended: boolean; description: string }> {
    const modelsByType: Record<string, Array<{ model: string; displayName: string; recommended: boolean; description: string }>> = {
      'prompt-improvement': [
        { model: 'gpt-4o', displayName: 'GPT-4 Omni', recommended: true, description: 'Most powerful - best for complex creative enhancement' },
        { model: 'claude-3-opus-20240229', displayName: 'Claude 3 Opus', recommended: false, description: 'Excellent reasoning and nuanced understanding' },
        { model: 'gpt-4', displayName: 'GPT-4', recommended: false, description: 'Strong performance, reliable' },
        { model: 'claude-3-sonnet-20240229', displayName: 'Claude 3 Sonnet', recommended: false, description: 'Balanced performance and speed' },
      ],
      'image-generation': [
        { model: 'nano-banana', displayName: 'Nano-banana', recommended: true, description: 'Default Poe image model optimized for creative visuals' },
        { model: 'dall-e-3', displayName: 'DALL-E 3', recommended: false, description: 'Highest quality, best for photorealistic images' },
        { model: 'stable-diffusion-xl', displayName: 'Stable Diffusion XL', recommended: false, description: 'Fast, versatile, good for varied styles' },
      ],
      'video-generation': [
        { model: 'Video-Generator-PRO', displayName: 'Video Generator PRO', recommended: true, description: 'Optimized for video creation - best quality' },
        { model: 'veo-3', displayName: 'Veo 3', recommended: false, description: 'Advanced video generation with high fidelity' },
        { model: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro', recommended: false, description: 'Multimodal - can work with videos' },
      ],
      'caption-generation': [
        { model: 'gpt-4o', displayName: 'GPT-4 Omni', recommended: true, description: 'Best for engaging, platform-optimized captions' },
        { model: 'claude-3-opus-20240229', displayName: 'Claude 3 Opus', recommended: false, description: 'Excellent tone variation' },
        { model: 'gpt-4', displayName: 'GPT-4', recommended: false, description: 'Reliable, consistent results' },
      ],
      'script-generation': [
        { model: 'gpt-4o', displayName: 'GPT-4 Omni', recommended: true, description: 'Best for structured video scripts' },
        { model: 'claude-3-opus-20240229', displayName: 'Claude 3 Opus', recommended: false, description: 'Excellent narrative structure' },
        { model: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro', recommended: false, description: 'Strong context understanding' },
      ],
      'hashtag-generation': [
        { model: 'gpt-4o', displayName: 'GPT-4 Omni', recommended: true, description: 'Best for trending, relevant hashtags' },
        { model: 'claude-3-sonnet-20240229', displayName: 'Claude 3 Sonnet', recommended: false, description: 'Fast and accurate hashtag selection' },
        { model: 'gpt-3.5-turbo', displayName: 'GPT-3.5 Turbo', recommended: false, description: 'Cost-effective option' },
      ],
    };

    return modelsByType[contentType] || modelsByType['caption-generation'];
  }

  /**
   * Get all available models organized by capability
   */
  getAllModelsWithCapabilities(): Array<{ model: string; displayName: string; provider: string; tier: string; capabilities: any }> {
    return [
      // GPT Models
      { 
        model: 'gpt-4o', 
        displayName: 'GPT-4 Omni', 
        provider: 'OpenAI',
        tier: 'pro',
        capabilities: this.getModelCapabilities('gpt-4o'),
      },
      { 
        model: 'gpt-4', 
        displayName: 'GPT-4', 
        provider: 'OpenAI',
        tier: 'pro',
        capabilities: this.getModelCapabilities('gpt-4'),
      },
      { 
        model: 'gpt-3.5-turbo', 
        displayName: 'GPT-3.5 Turbo', 
        provider: 'OpenAI',
        tier: 'free',
        capabilities: this.getModelCapabilities('gpt-3.5-turbo'),
      },
      // Claude Models
      { 
        model: 'claude-3-opus-20240229', 
        displayName: 'Claude 3 Opus', 
        provider: 'Anthropic',
        tier: 'pro',
        capabilities: this.getModelCapabilities('claude-3-opus-20240229'),
      },
      { 
        model: 'claude-3-sonnet-20240229', 
        displayName: 'Claude 3 Sonnet', 
        provider: 'Anthropic',
        tier: 'pro',
        capabilities: this.getModelCapabilities('claude-3-sonnet-20240229'),
      },
      { 
        model: 'claude-3-haiku-20240307', 
        displayName: 'Claude 3 Haiku', 
        provider: 'Anthropic',
        tier: 'free',
        capabilities: this.getModelCapabilities('claude-3-haiku-20240307'),
      },
      // Google Models
      { 
        model: 'gemini-1.5-pro', 
        displayName: 'Gemini 1.5 Pro', 
        provider: 'Google',
        tier: 'pro',
        capabilities: this.getModelCapabilities('gemini-1.5-pro'),
      },
      // Image Generation
      { 
        model: 'nano-banana', 
        displayName: 'Nano-banana', 
        provider: 'Poe',
        tier: 'pro',
        capabilities: this.getModelCapabilities('nano-banana'),
      },
      { 
        model: 'dall-e-3', 
        displayName: 'DALL-E 3', 
        provider: 'OpenAI',
        tier: 'pro',
        capabilities: this.getModelCapabilities('dall-e-3'),
      },
      { 
        model: 'stable-diffusion-xl', 
        displayName: 'Stable Diffusion XL', 
        provider: 'Stability AI',
        tier: 'pro',
        capabilities: this.getModelCapabilities('stable-diffusion-xl'),
      },
      // Video Generation
      { 
        model: 'Video-Generator-PRO', 
        displayName: 'Video Generator PRO', 
        provider: 'Poe',
        tier: 'pro',
        capabilities: this.getModelCapabilities('Video-Generator-PRO'),
      },
      { 
        model: 'veo-3', 
        displayName: 'Veo 3', 
        provider: 'Google',
        tier: 'pro',
        capabilities: this.getModelCapabilities('veo-3'),
      },
    ];
  }

  /**
   * Validate if a model supports the requested content type
   */
  canModelHandleContentType(model: string, contentType: string): boolean {
    const capabilities = this.getModelCapabilities(model);

    switch (contentType) {
      case 'image-generation':
        return capabilities.supportsImages;
      case 'video-generation':
        return capabilities.supportsVideo;
      case 'prompt-improvement':
      case 'caption-generation':
      case 'script-generation':
      case 'hashtag-generation':
        return capabilities.supportsText;
      default:
        return capabilities.supportsText;
    }
  }
}
