import { Injectable } from '@nestjs/common';
import { CreateCampaignDto } from '../../../shared';
import { PoeClient } from './poe.client';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class StrategyEngine {
  constructor(
    private readonly poeClient: PoeClient,
    private readonly storageService: StorageService, // Inject StorageService
  ) {}

  async generate(createCampaignDto: CreateCampaignDto): Promise<string> {
    try {
      const input = {
        model: createCampaignDto.model || 'models/embedding-gecko-001', // Support AI model selection
        contents: JSON.stringify(createCampaignDto),
      };
      const response = await this.poeClient.generateContent('strategy', input);

      // Upload generated content to R2
      const buffer = Buffer.from(response, 'utf-8');
      const uploadedUrl = await this.storageService.uploadFile(
        buffer,
        `${createCampaignDto.campaignId}-strategy.txt`,
        'text/plain',
      );

      return uploadedUrl; // Return the R2 URL
    } catch (error) {
      console.error('Error generating strategy:', error);
      throw new Error('Failed to generate strategy');
    }
  }
}