import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { AIContentServiceClient } from './ai-content-service.client';
import { ContentGenerationService } from './content-generation.service';
import { ContentGenerationController } from './content-generation.controller';
import { StorageModule } from '../../infrastructure/storage/storage.module';

// Schema for storing generation metadata and job tracking
const GenerationJobSchema = {
  tenant_id: String,
  user_id: String,
  job_id: String,
  type: String, // 'text', 'image', 'video', 'prompt-improvement'
  request: Object,
  response: Object,
  status: String, // 'pending', 'processing', 'completed', 'failed'
  result: Object,
  error: String,
  progress: Number,
  storage_path: String,
  created_at: Date,
  completed_at: Date,
};

/**
 * ContentModule
 * 
 * Core module for content generation functionality.
 * Provides unified interface to AI Content Service microservice.
 * 
 * Exports:
 * - ContentGenerationService: High-level orchestration service
 * - AIContentServiceClient: Low-level HTTP client
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    StorageModule,
    MongooseModule.forFeature([
      {
        name: 'GenerationJob',
        schema: GenerationJobSchema,
      },
    ]),
  ],
  controllers: [ContentGenerationController],
  providers: [AIContentServiceClient, ContentGenerationService],
  exports: [AIContentServiceClient, ContentGenerationService],
})
export class ContentModule {}
