import { Module } from '@nestjs/common';
import { PromptingEngineService } from './prompting-engine.service';
import { PromptingService } from './prompting.service';
import { ModelsModule } from '../models/models.module';

@Module({
  imports: [ModelsModule],
  providers: [PromptingEngineService, PromptingService],
  exports: [PromptingEngineService, PromptingService],
})
export class PromptingModule {}
