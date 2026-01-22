import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Logger,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VideoGenerationService } from './video-generation.service';
import {
  GenerateVideoWithReferenceDto,
  VideoGenerationResponseDto,
  VideoModelDto,
} from './video-generation.dto';

@Controller('video')
@UseGuards(AuthGuard('jwt'))
export class VideoGenerationController {
  private readonly logger = new Logger(VideoGenerationController.name);

  constructor(private readonly videoGenerationService: VideoGenerationService) {}

  /**
   * Generate video with optional reference images for brand consistency
   *
   * POST /api/video/generate
   *
   * Request body:
   * {
   *   "prompt": "A brand logo animation with motion graphics",
   *   "duration": 6,
   *   "model": "sora-2-pro",
   *   "referenceImageUrls": ["https://example.com/logo.png"],
   *   "refinementPrompt": "Make it cinematic with dramatic lighting"
   * }
   *
   * Response:
   * {
   *   "videoUrl": "https://r2-storage.../video.mp4",
   *   "videoPath": "videos/1234567890-abc123.mp4",
   *   "prompt": "A brand logo animation with motion graphics",
   *   "refinedPrompt": "A brand logo animation with motion graphics, cinematic lighting...",
   *   "model": "sora-2-pro",
   *   "duration": 6,
   *   "referenceImages": [\n   *     { "url": "https://...", "uploadedAt": "2026-01-16T..." }\n   *   ],
   *   "metadata": { ... }\n   * }
   */
  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  async generateVideo(
    @Body() dto: GenerateVideoWithReferenceDto,
  ): Promise<VideoGenerationResponseDto> {
    this.logger.log('[VideoGenerationController] Generate video request', {
      prompt: dto.prompt.substring(0, 100),
      model: dto.model || 'sora-2-pro',
      duration: dto.duration,
      hasReferenceImages: !!dto.referenceImageUrls?.length,
    });

    if (!dto.prompt || dto.prompt.trim().length === 0) {
      throw new BadRequestException('Prompt is required');
    }

    const model = dto.model || 'sora-2';
    const requestedDuration = dto.duration ?? (model.includes('kling') ? 5 : 4);
    const allowedDurations = model.includes('kling') ? [5, 10] : [4, 8, 12];

    if (!allowedDurations.includes(requestedDuration)) {
      throw new BadRequestException(
        model.includes('kling')
          ? 'Duration must be 5 or 10 seconds for Kling (defaults to 5s).'
          : 'Duration must be 4, 8, or 12 seconds for Sora (defaults to 4s).',
      );
    }

    dto.duration = requestedDuration;

    const result = await this.videoGenerationService.generateVideoWithReferences(dto);

    this.logger.log('[VideoGenerationController] Video generated successfully', {
      videoUrl: result.videoUrl.substring(0, 50) + '...',
      model: result.model,
      duration: result.duration,
    });

    return result;
  }

  /**
   * Get supported video generation models
   *
   * GET /api/video/models
   *
   * Response:
   * [
   *   {
   *     "key": "sora-2-pro",
   *     "name": "OpenAI Sora 2 Pro",
   *     "description": "Advanced video generation with style reference support",
   *     "durationRange": { "min": 5, "max": 60 },
   *     "supportsReferenceImages": true,
   *     "quality": "highest"
   *   },
   *   ...
   * ]
   */
  @Get('models')
  @HttpCode(HttpStatus.OK)
  getModels(): VideoModelDto[] {
    this.logger.log('[VideoGenerationController] Fetching supported models');
    return this.videoGenerationService.getSupportedModels();
  }

  /**
   * Example: Generate video with brand logo reference
   *
   * POST /api/video/examples/brand-animation
   *
   * Creates a video using your brand logo as a style reference
   */
  @Post('examples/brand-animation')
  @HttpCode(HttpStatus.ACCEPTED)
  async brandAnimationExample(
    @Body()
    dto: {
      brandLogoUrl: string;
      productName: string;
      tagline: string;
    },
  ): Promise<VideoGenerationResponseDto> {
    const prompt = `
Create a professional brand animation video featuring the ${dto.productName} brand logo.

Requirements:
- Logo should animate smoothly into frame
- Include tagline: "${dto.tagline}"\n- Professional color grading and lighting
- Cinematic camera movement
- Modern music-ready pacing
- High production quality

Style reference provided via image input.
    `.trim();

    return this.videoGenerationService.generateVideoWithReferences({
      prompt,
      model: 'sora-2',
      duration: 5,
      referenceImageUrls: [dto.brandLogoUrl],
      refinementPrompt: 'Make it match the brand aesthetic from the provided logo image',
    });
  }

  /**
   * Example: Generate product showcase video
   *
   * POST /api/video/examples/product-showcase
   *
   * Creates a product showcase video with reference images
   */
  @Post('examples/product-showcase')
  @HttpCode(HttpStatus.ACCEPTED)
  async productShowcaseExample(
    @Body()
    dto: {
      productName: string;
      productDescription: string;
      referenceImageUrls: string[]; // Product photos or mood board
    },
  ): Promise<VideoGenerationResponseDto> {
    const prompt = `
Create a professional product showcase video for ${dto.productName}.

Product Description:
${dto.productDescription}

Requirements:
- Product displayed from multiple angles
- Highlight key features and benefits
- Professional studio lighting
- Smooth, elegant transitions
- Include text overlays for key selling points
- High-quality production
- Motion graphics elements

Style and aesthetic should match the provided reference images.
    `.trim();

    return this.videoGenerationService.generateVideoWithReferences({
      prompt,
      model: 'sora-2',
      duration: 5,
      referenceImageUrls: dto.referenceImageUrls,
      refinementPrompt: 'Ensure the visual style matches the brand aesthetic from the reference images',
    });
  }

  /**
   * Example: Generate social media video
   *
   * POST /api/video/examples/social-media\n   *
   * Creates a short, eye-catching video for social platforms
   */
  @Post('examples/social-media')
  @HttpCode(HttpStatus.ACCEPTED)
  async socialMediaExample(
    @Body()
    dto: {
      concept: string;
      platform: 'instagram' | 'tiktok' | 'youtube' | 'facebook';
      brandImages?: string[];
    },
  ): Promise<VideoGenerationResponseDto> {
    const aspectRatios = {
      instagram: '1:1' as const,
      tiktok: '9:16' as const,
      youtube: '16:9' as const,
      facebook: '16:9' as const,
    };

    const prompt = `
Create a viral-worthy social media video for ${dto.platform.toUpperCase()}.

Concept:
${dto.concept}

Requirements:
- Optimized for ${dto.platform} (${aspectRatios[dto.platform]} aspect ratio)
- Attention-grabbing first 2 seconds
- Clear, punchy messaging
- Trending visual style
- On-brand consistent aesthetic
- Shareable and engaging content
- Professional production quality

Keep duration between 5-15 seconds for maximum engagement.
    `.trim();

    return this.videoGenerationService.generateVideoWithReferences({
      prompt,
      model: 'sora-2',
      duration: 5,
      aspectRatio: aspectRatios[dto.platform],
      referenceImageUrls: dto.brandImages,
      refinementPrompt: `Optimize this video for ${dto.platform} with trending aesthetics and high engagement potential`,
    });
  }
}
