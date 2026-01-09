import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PoeClient } from './poe.client';
import { Logger } from '@nestjs/common';

@Controller('poe')
export class PoeController {
  private readonly logger = new Logger(PoeController.name);

  constructor(private readonly poeClient: PoeClient) {}

  @Post('improve-prompt')
  @UseGuards(JwtAuthGuard)
  async improvePrompt(
    @Body()
    body: {
      prompt: string;
      context?: {
        targetAudience?: string;
        tone?: string;
        style?: string;
      };
    },
    @Request() req: any,
  ) {
    try {
      this.logger.log('[improvePrompt] Improving prompt for user', {
        promptLength: body.prompt.length,
        userId: req.user?.id,
      });

      const systemPrompt = `You are an expert video prompt engineer. Your task is to improve and enhance video generation prompts.
      
When given a video prompt, you should:
1. Enhance it with more vivid, descriptive language
2. Add technical film/video production terms for better quality
3. Include aspect ratios and visual style preferences if not present
4. Make it more specific and actionable for AI video generation
5. Suggest improvements that would result in professional-quality video output

${body.context ? `Consider the following context:
- Target Audience: ${body.context.targetAudience || 'General'}
- Tone: ${body.context.tone || 'Professional'}
- Style: ${body.context.style || 'Modern'}` : ''}

Return ONLY the improved prompt, nothing else.`;

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
}
