import { Controller, Get, UseGuards } from '@nestjs/common';
import { AIModelsService } from './ai-models.service';

@Controller('ai-models')
export class AIModelsController {
  constructor(private readonly aiModelsService: AIModelsService) {}

  @Get()
  getModels() {
    return this.aiModelsService.getAvailableModels();
  }
}