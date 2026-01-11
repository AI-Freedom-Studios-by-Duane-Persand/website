import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PoeClient } from './poe.client';
import { AIModelsService } from './ai-models.service';
import { Logger } from '@nestjs/common';
import { ImprovePromptDto } from './dto/improve-prompt.dto';
import { GetAvailableModelsDto, SelectModelDto, ContentType } from './dto/model-selection.dto';
import { CurrentUser, JwtPayload } from '../auth';

@Controller('poe')
export class PoeController {
  private readonly logger = new Logger(PoeController.name);

  constructor(
    private readonly poeClient: PoeClient,
    private readonly aiModelsService: AIModelsService,
  ) {}

  @Post('improve-prompt')
  @UseGuards(JwtAuthGuard)
  async improvePrompt(
    @Body() body: ImprovePromptDto,
    @CurrentUser() user: JwtPayload,
  ) {
    try {
      this.logger.log('[improvePrompt] Improving prompt for user', {
        promptLength: body.prompt.length,
        userId: user.userId,
      });

      // PoeClient builds its own system prompt; pass prompt/context only
      const improvedPrompt = await this.poeClient.improvePrompt(body.prompt, body.context);

      this.logger.log('[improvePrompt] Prompt improved successfully', {
        originalLength: body.prompt.length,
        improvedLength: improvedPrompt.length,
      });

      return {
        originalPrompt: body.prompt,
        improvedPrompt: improvedPrompt.trim(),
        context: body.context,
      };
    } catch (error) {
      this.logger.error('[improvePrompt] Error improving prompt', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  @Get('models/available')
  @UseGuards(JwtAuthGuard)
  async getAvailableModels(@Query() query: GetAvailableModelsDto) {
    try {
      this.logger.log('[getAvailableModels] Fetching models for content type', {
        contentType: query.contentType,
      });

      const combined = this.poeClient.getModelsForContentType(query.contentType);
      const aiModels = this.aiModelsService.getModelsForContentType(query.contentType);

      return {
        contentType: query.contentType,
        availableModels: aiModels.availableModels,
        recommendedModel: aiModels.recommendedModel,
      };
    } catch (error) {
      this.logger.error('[getAvailableModels] Error fetching models', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  @Get('models/all')
  @UseGuards(JwtAuthGuard)
  async getAllModels() {
    try {
      this.logger.log('[getAllModels] Fetching all available models with capabilities');

      const allModels = this.poeClient.getAllModelsWithCapabilities();

      return {
        total: allModels.length,
        models: allModels,
        grouped: {
          textGeneration: allModels.filter(m => m.capabilities.supportsText),
          imageGeneration: allModels.filter(m => m.capabilities.supportsImages),
          videoGeneration: allModels.filter(m => m.capabilities.supportsVideo),
          multimodal: allModels.filter(m => m.capabilities.isMultimodal),
        },
      };
    } catch (error) {
      this.logger.error('[getAllModels] Error fetching all models', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  @Post('models/validate')
  @UseGuards(JwtAuthGuard)
  async validateModelForContentType(
    @Body() body: SelectModelDto,
    @CurrentUser() user: JwtPayload,
  ) {
    try {
      this.logger.log('[validateModelForContentType] Validating model', {
        model: body.model,
        contentType: body.contentType,
        userId: user.userId,
      });

      const isValid = this.poeClient.canModelHandleContentType(body.model, body.contentType);
      const capabilities = this.poeClient.getModelCapabilities(body.model);

      return {
        model: body.model,
        contentType: body.contentType,
        isValid,
        capabilities: {
          supportsText: capabilities.supportsText,
          supportsImages: capabilities.supportsImages,
          supportsVideo: capabilities.supportsVideo,
          isMultimodal: capabilities.isMultimodal,
        },
        message: isValid 
          ? `Model ${body.model} is suitable for ${body.contentType}` 
          : `Model ${body.model} cannot handle ${body.contentType}`,
      };
    } catch (error) {
      this.logger.error('[validateModelForContentType] Error validating model', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  @Post('generate-with-model')
  @UseGuards(JwtAuthGuard)
  async generateContentWithModel(
    @Body() body: SelectModelDto,
    @CurrentUser() user: JwtPayload,
  ) {
    try {
      this.logger.log('[generateContentWithModel] Generating content with selected model', {
        contentType: body.contentType,
        model: body.model,
        userId: user.userId,
      });

      // Validate model can handle this content type
      if (!this.poeClient.canModelHandleContentType(body.model, body.contentType)) {
        throw new Error(`Model ${body.model} cannot handle ${body.contentType}`);
      }

      // Prepare input based on content type
      const input = {
        model: body.model,
        contents: body.prompt || '',
      };

      // Generate content using the selected model
      let result: string;
      switch (body.contentType) {
        case ContentType.PROMPT_IMPROVEMENT:
          // For prompt improvement, call improvePrompt directly
          result = body.context 
            ? await this.poeClient.improvePrompt(body.prompt, { style: body.context })
            : await this.poeClient.improvePrompt(body.prompt);
          return {
            contentType: body.contentType,
            model: body.model,
            originalContent: body.prompt,
            generatedContent: result,
          };

        case ContentType.CAPTION_GENERATION:
          result = await this.poeClient.generateContent('creative-text', input);
          return {
            contentType: body.contentType,
            model: body.model,
            prompt: body.prompt,
            generatedContent: result,
          };

        case ContentType.SCRIPT_GENERATION:
          result = await this.poeClient.generateContent('creative-video', input);
          return {
            contentType: body.contentType,
            model: body.model,
            prompt: body.prompt,
            generatedContent: result,
          };

        case ContentType.HASHTAG_GENERATION:
          result = await this.poeClient.generateContent('creative-text', {
            ...input,
            contents: `Generate 10-15 relevant hashtags for: ${body.prompt}. Return as JSON array: {"hashtags": ["tag1", "tag2"]}`,
          });
          return {
            contentType: body.contentType,
            model: body.model,
            prompt: body.prompt,
            generatedContent: result,
          };

        default:
          result = await this.poeClient.generateContent('creative-text', input);
          return {
            contentType: body.contentType,
            model: body.model,
            prompt: body.prompt,
            generatedContent: result,
          };
      }
    } catch (error) {
      this.logger.error('[generateContentWithModel] Error generating content', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }
}
