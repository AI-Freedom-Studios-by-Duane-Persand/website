import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AIModelsService } from './ai-models.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai-models')
export class AIModelsController {
  constructor(private readonly aiModelsService: AIModelsService) {}

  @Get()
  getModels() {
    return this.aiModelsService.getAvailableModels();
  }

  @Get('available')
  @UseGuards(JwtAuthGuard)
  getAvailable(@Query('contentType') contentType: string) {
    if (!contentType) {
      return { error: 'contentType is required' };
    }
    return this.aiModelsService.getModelsForContentType(contentType);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  getAll() {
    return this.aiModelsService.getAllModelsWithCapabilities();
  }
}