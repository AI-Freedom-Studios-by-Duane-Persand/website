import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PoeClient } from './poe.client';
import { Logger } from '@nestjs/common';
import { ImprovePromptDto } from './dto/improve-prompt.dto';
import { CurrentUser, JwtPayload } from '../auth';

@Controller('poe')
export class PoeController {
  private readonly logger = new Logger(PoeController.name);

  constructor(private readonly poeClient: PoeClient) {}

  @Post('improve-prompt')
  @UseGuards(JwtAuthGuard)
  async improvePrompt(
    @Body() body: ImprovePromptDto,
    @CurrentUser() user: JwtPayload,
  ) {
    try {
      this.logger.log('[improvePrompt] Improving prompt for user', {
        promptLength: body.prompt.length,
        userId: user?.userId,
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
}
