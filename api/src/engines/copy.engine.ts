/**
 * Copy Engine
 * 
 * Domain service for generating marketing copy using AI.
 * Depends on port interfaces (IContentGenerator, IStorageProvider) instead of concrete implementations.
 * 
 * Responsibilities:
 * - Generate marketing copy based on campaign data
 * - Store generated copy in cloud storage
 * - Return storage URLs for copy documents
 */

import { Injectable } from '@nestjs/common';
import { CreateCampaignDto } from '../../../shared';
import { IContentGenerator } from '../domain/ports/content-generator.interface';
import { IStorageProvider } from '../domain/ports/storage-provider.interface';

@Injectable()
export class CopyEngine {
  constructor(
    private readonly contentGenerator: IContentGenerator,
    private readonly storageProvider: IStorageProvider,
  ) {}

  async generate(createCampaignDto: CreateCampaignDto): Promise<string> {
    try {
      // Generate copy content using AI
      const result = await this.contentGenerator.generate({
        prompt: this.buildCopyPrompt(createCampaignDto),
        contentType: 'text',
        model: createCampaignDto.model || 'gpt-3.5-turbo',
        metadata: {
          campaignId: createCampaignDto.campaignId,
          type: 'copy',
          platforms: createCampaignDto.platforms,
        },
      });

      // Upload generated copy to storage
      const buffer = Buffer.from(result.content, 'utf-8');
      const storageRef = await this.storageProvider.upload(
        buffer,
        `campaigns/${createCampaignDto.campaignId}/copy-${Date.now()}.txt`,
        {
          name: `${createCampaignDto.campaignId}-copy.txt`,
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
      console.error('Error generating copy:', errorMessage);
      throw new Error(`Failed to generate copy: ${errorMessage}`);
    }
  }

  /**
   * Build copy generation prompt from campaign data
   */
  private buildCopyPrompt(dto: CreateCampaignDto): string {
    return `
Generate engaging marketing copy for the following campaign:

Name: ${dto.name || 'Untitled Campaign'}
Description: ${dto.description || 'No description provided'}
Platforms: ${dto.platforms?.join(', ') || 'Not specified'}
Target Audience: ${(dto as any).targetAudience || 'General audience'}
Tone: ${(dto as any).tone || 'Professional and engaging'}

Please provide:
1. Main headline (attention-grabbing, 10 words max)
2. Subheadline (compelling value proposition, 20 words max)
3. Body copy (3-4 paragraphs highlighting benefits and features)
4. Call-to-action (clear and actionable)
5. Platform-specific variations (if multiple platforms specified)

Format the response as a structured document with clear sections.
    `.trim();
  }
}
