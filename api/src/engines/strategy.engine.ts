/**
 * Strategy Engine
 * 
 * Domain service for generating marketing strategies using AI.
 * Depends on port interfaces (IContentGenerator, IStorageProvider) instead of concrete implementations.
 * 
 * Responsibilities:
 * - Generate marketing strategies based on campaign data
 * - Store generated strategies in cloud storage
 * - Return storage URLs for strategy documents
 */

import { Injectable } from '@nestjs/common';
import { CreateCampaignDto } from '../../../shared';
import { IContentGenerator } from '../domain/ports/content-generator.interface';
import { IStorageProvider } from '../domain/ports/storage-provider.interface';

@Injectable()
export class StrategyEngine {
  constructor(
    private readonly contentGenerator: IContentGenerator,
    private readonly storageProvider: IStorageProvider,
  ) {}

  async generate(createCampaignDto: CreateCampaignDto): Promise<string> {
    try {
      // Generate strategy content using AI
      const result = await this.contentGenerator.generate({
        prompt: this.buildStrategyPrompt(createCampaignDto),
        contentType: 'text',
        model: createCampaignDto.model || 'gpt-3.5-turbo',
        metadata: {
          campaignId: createCampaignDto.campaignId,
          type: 'strategy',
          platforms: createCampaignDto.platforms,
        },
      });

      // Upload generated strategy to storage
      const buffer = Buffer.from(result.content, 'utf-8');
      const storageRef = await this.storageProvider.upload(
        buffer,
        `campaigns/${createCampaignDto.campaignId}/strategy-${Date.now()}.txt`,
        {
          name: `${createCampaignDto.campaignId}-strategy.txt`,
          mimeType: 'text/plain',
          custom: {
            campaignId: createCampaignDto.campaignId,
            generatedBy: result.model,
            provider: result.provider,
          },
        },
      );

      return storageRef.url; // Return the public URL
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error generating strategy:', errorMessage);
      throw new Error(`Failed to generate strategy: ${errorMessage}`);
    }
  }

  /**
   * Build strategy generation prompt from campaign data
   */
  private buildStrategyPrompt(dto: CreateCampaignDto): string {
    return `
Generate a comprehensive marketing strategy for the following campaign:

Name: ${dto.name || 'Untitled Campaign'}
Description: ${dto.description || 'No description provided'}
Platforms: ${dto.platforms?.join(', ') || 'Not specified'}
Target Audience: ${(dto as any).targetAudience || 'General audience'}
Budget: ${(dto as any).budget || 'Not specified'}

Please provide:
1. Campaign objectives
2. Target audience analysis
3. Platform-specific strategies
4. Key messaging
5. Content themes
6. Success metrics

Format the response as a structured document.
    `.trim();
  }
}
