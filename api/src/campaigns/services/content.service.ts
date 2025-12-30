// api/src/campaigns/services/content.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CampaignDocument } from '../../models/campaign.schema';
import { AddContentVersionDto } from '../dto/content-version.dto';
import { PoeClient } from '../../engines/poe.client';
import { StorageService } from '../../storage/storage.service';

export interface RegenerateContentDto {
  campaignId: string;
  userId: string;
  tenantId: string;
  regenerationType: 'all' | 'text' | 'images' | 'videos';
  aiModel?: string;
  preserveExisting?: boolean;
  generatePromptsOnly?: boolean; // Phase 1: generate prompts/scripts only
}

export interface ExecutePromptsDto {
  campaignId: string;
  tenantId: string;
  userId: string;
  contentType: 'images' | 'videos';
  promptUrls: string[];
}

export interface SelectiveRegenerationDto {
  campaignId: string;
  userId: string;
  tenantId: string;
  textOnly?: boolean;
  imagesOnly?: boolean;
  videosOnly?: boolean;
  aiModel?: string;
}

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    @InjectModel('Campaign') private readonly campaignModel: Model<CampaignDocument>,
    private readonly poeClient: PoeClient,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Add a new content version to a campaign
   */
  async addContentVersion(dto: AddContentVersionDto, tenantId: string): Promise<CampaignDocument> {
    this.logger.log(`Adding content version for campaign ${dto.campaignId}`);

    const campaign = await this.campaignModel.findOne({ 
      _id: dto.campaignId, 
      tenantId 
    }).exec();

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${dto.campaignId} not found`);
    }

    // Verify strategy version exists
    const strategy = campaign.strategyVersions.find((s: any) => s.version === dto.strategyVersion);
    if (!strategy) {
      throw new BadRequestException(`Strategy version ${dto.strategyVersion} not found`);
    }

    const newVersion = (campaign.contentVersions?.length || 0) + 1;
    const now = new Date();

    campaign.contentVersions.push({
      version: newVersion,
      createdAt: now,
      createdBy: dto.userId,
      mode: dto.mode,
      textAssets: dto.textAssets || [],
      imageAssets: dto.imageAssets || [],
      videoAssets: dto.videoAssets || [],
      aiModel: dto.aiModel,
      regenerationMeta: dto.regenerationMeta || {},
      strategyVersion: dto.strategyVersion,
      needsReview: dto.needsReview || false,
      invalidated: false,
    });

    // Update approval state
    campaign.approvalStates.content = 'pending';

    campaign.statusHistory.push({
      status: 'content_created',
      changedAt: now,
      changedBy: dto.userId,
      note: dto.note || `Content version ${newVersion} added`,
    });

    campaign.revisionHistory.push({
      revision: (campaign.revisionHistory?.length || 0) + 1,
      changedAt: now,
      changedBy: dto.userId,
      changes: { contentVersion: newVersion, mode: dto.mode },
      note: dto.note,
    });

    await campaign.save();
    this.logger.log(`Content version ${newVersion} added successfully`);
    return campaign;
  }

  /**
   * Regenerate content with AI
   */
  async regenerateContent(dto: RegenerateContentDto): Promise<CampaignDocument> {
    const mode = dto.generatePromptsOnly ? 'prompts/scripts' : 'full content';
    this.logger.log(`Regenerating ${dto.regenerationType} ${mode} for campaign ${dto.campaignId}`);

    const campaign = await this.campaignModel.findOne({ 
      _id: dto.campaignId, 
      tenantId: dto.tenantId 
    }).exec();

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${dto.campaignId} not found`);
    }

    const latestStrategy = campaign.strategyVersions[campaign.strategyVersions.length - 1];
    const latestContent = campaign.contentVersions[campaign.contentVersions.length - 1];

    if (!latestStrategy) {
      throw new BadRequestException('No strategy found for content generation');
    }

    // Generate new content based on type
    const newAssets: any = {
      textAssets: dto.preserveExisting ? [...(latestContent?.textAssets || [])] : [],
      imageAssets: dto.preserveExisting ? [...(latestContent?.imageAssets || [])] : [],
      videoAssets: dto.preserveExisting ? [...(latestContent?.videoAssets || [])] : [],
    };

    if (dto.regenerationType === 'all' || dto.regenerationType === 'text') {
      newAssets.textAssets = await this.generateTextContent(campaign, dto.aiModel);
    }

    if (dto.regenerationType === 'all' || dto.regenerationType === 'images') {
      newAssets.imageAssets = await this.generateImageContent(campaign, dto.aiModel, dto.generatePromptsOnly);
    }

    if (dto.regenerationType === 'all' || dto.regenerationType === 'videos') {
      newAssets.videoAssets = await this.generateVideoContent(campaign, dto.aiModel, dto.generatePromptsOnly ?? true);
    }

    // Add new content version
    const newVersion = (campaign.contentVersions?.length || 0) + 1;
    const now = new Date();

    campaign.contentVersions.push({
      version: newVersion,
      createdAt: now,
      createdBy: dto.userId,
      mode: 'ai',
      textAssets: newAssets.textAssets,
      imageAssets: newAssets.imageAssets,
      videoAssets: newAssets.videoAssets,
      aiModel: dto.aiModel || 'GPT-4o',
      regenerationMeta: {
        type: dto.regenerationType,
        preservedExisting: dto.preserveExisting,
      },
      strategyVersion: latestStrategy.version,
      needsReview: true,
      invalidated: false,
    });

    campaign.approvalStates.content = 'needs_review';

    campaign.revisionHistory.push({
      revision: (campaign.revisionHistory?.length || 0) + 1,
      changedAt: now,
      changedBy: dto.userId,
      changes: { regenerated: dto.regenerationType, contentVersion: newVersion },
      note: `Content regenerated: ${dto.regenerationType}`,
    });

    await campaign.save();
    this.logger.log(`Content regenerated successfully`);
    return campaign;
  }

  /**
   * Selective regeneration (text only, images only, etc.)
   */
  async executePrompts(dto: ExecutePromptsDto): Promise<CampaignDocument> {
    this.logger.log(`Executing ${dto.promptUrls.length} ${dto.contentType} prompts for campaign ${dto.campaignId}`);

    const campaign = await this.campaignModel.findOne({
      _id: dto.campaignId,
      tenantId: dto.tenantId,
    }).exec();

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${dto.campaignId} not found`);
    }

    const executedAssets: string[] = [];

    if (dto.contentType === 'images') {
      for (const promptUrl of dto.promptUrls) {
        try {
          // Mark prompts as ready; actual image generation can be triggered downstream
          await this.storageService.tagAsset(promptUrl, dto.tenantId, ['ready-for-generation']);
          executedAssets.push(promptUrl);
        } catch (error: any) {
          this.logger.error(`[executePrompts] Failed to process image prompt: ${error.message}`);
          executedAssets.push(promptUrl);
        }
      }
    } else if (dto.contentType === 'videos') {
      for (const scriptUrl of dto.promptUrls) {
        await this.storageService.tagAsset(scriptUrl, dto.tenantId, ['production-ready', 'approved']);
      }
      executedAssets.push(...dto.promptUrls);
    }

    const now = new Date();
    campaign.revisionHistory.push({
      revision: (campaign.revisionHistory?.length || 0) + 1,
      changedAt: now,
      changedBy: dto.userId,
      changes: { executed: dto.contentType, count: executedAssets.length },
      note: `Executed ${executedAssets.length} ${dto.contentType} prompts`,
    });

    await campaign.save();
    return campaign;
  }

  /**
   * Selective regeneration (text only, images only, etc.)
   */
  async selectiveRegeneration(dto: SelectiveRegenerationDto): Promise<CampaignDocument> {
    const regenerationType = dto.textOnly ? 'text' : 
                           dto.imagesOnly ? 'images' : 
                           dto.videosOnly ? 'videos' : 'all';

    return this.regenerateContent({
      campaignId: dto.campaignId,
      userId: dto.userId,
      tenantId: dto.tenantId,
      regenerationType,
      aiModel: dto.aiModel,
      preserveExisting: true, // Preserve non-regenerated assets
    });
  }

  /**
   * Get latest content version
   */
  async getLatestContentVersion(campaignId: string, tenantId: string): Promise<any> {
    const campaign = await this.campaignModel.findOne({ 
      _id: campaignId, 
      tenantId 
    }).exec();

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
    }

    const activeContent = campaign.contentVersions.filter((c: any) => !c.invalidated);
    
    if (activeContent.length === 0) {
      throw new BadRequestException('No active content version found');
    }

    return activeContent[activeContent.length - 1];
  }

  /**
   * Replace specific assets without full regeneration
   */
  async replaceAssets(
    campaignId: string,
    tenantId: string,
    userId: string,
    replacements: Array<{ old: string; new: string; type: 'text' | 'image' | 'video' }>
  ): Promise<CampaignDocument> {
    const campaign = await this.campaignModel.findOne({ 
      _id: campaignId, 
      tenantId 
    }).exec();

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
    }

    const latestContent = campaign.contentVersions[campaign.contentVersions.length - 1];
    
    if (!latestContent) {
      throw new BadRequestException('No content version found');
    }

    // Apply replacements
    for (const replacement of replacements) {
      switch (replacement.type) {
        case 'text':
          const textIndex = latestContent.textAssets.indexOf(replacement.old);
          if (textIndex !== -1) {
            latestContent.textAssets[textIndex] = replacement.new;
          }
          break;
        case 'image':
          const imageIndex = latestContent.imageAssets.indexOf(replacement.old);
          if (imageIndex !== -1) {
            latestContent.imageAssets[imageIndex] = replacement.new;
          }
          break;
        case 'video':
          const videoIndex = latestContent.videoAssets.indexOf(replacement.old);
          if (videoIndex !== -1) {
            latestContent.videoAssets[videoIndex] = replacement.new;
          }
          break;
      }

      // Update storage service to mark asset as replaced
      await this.storageService.replaceAsset(replacement.old, replacement.new, tenantId);
    }

    const now = new Date();
    campaign.revisionHistory.push({
      revision: (campaign.revisionHistory?.length || 0) + 1,
      changedAt: now,
      changedBy: userId,
      changes: { assetsReplaced: replacements.length },
      note: `Replaced ${replacements.length} asset(s)`,
    });

    await campaign.save();
    this.logger.log(`Replaced ${replacements.length} assets`);
    return campaign;
  }

  // Private helper methods

  private async generateTextContent(campaign: CampaignDocument, aiModel?: string): Promise<string[]> {
    const strategy = campaign.strategyVersions[campaign.strategyVersions.length - 1];
    
    const prompt = this.buildTextGenerationPrompt(campaign, strategy);
    
    try {
      const response = await this.poeClient.generateContent('copy', {
        model: aiModel || 'GPT-4o',
        contents: prompt,
      });

      // Parse response into multiple text assets (captions, headlines, etc.)
      const textAssets = this.parseTextResponse(response);
      
      // Upload to R2 storage
      const urls: string[] = [];
      for (let i = 0; i < textAssets.length; i++) {
        const buffer = Buffer.from(textAssets[i], 'utf-8');
        const url = await this.storageService.uploadFile(buffer, {
          key: `${campaign._id}/text/content-${Date.now()}-${i}.txt`,
          contentType: 'text/plain',
          tenantId: campaign.tenantId.toString(),
          uploadedBy: 'system',
          tags: ['ai-generated', 'text', 'campaign-content'],
        });
        urls.push(url);
      }

      return urls;
    } catch (error) {
      this.logger.error('[generateTextContent] Failed to generate text content', error);
      throw new BadRequestException('Failed to generate text content');
    }
  }

  private async generateImageContent(
    campaign: CampaignDocument,
    aiModel?: string,
    promptsOnly = false,
  ): Promise<string[]> {
    const strategy = campaign.strategyVersions[campaign.strategyVersions.length - 1];
    
    const prompt = this.buildImageGenerationPrompt(campaign, strategy);
    
    try {
      // Step 1: Generate detailed image prompts using AI
      const response = await this.poeClient.generateContent('strategy', {
        model: aiModel || 'GPT-4o',
        contents: prompt,
      });

      const imagePrompts = this.parseImagePrompts(response);
      this.logger.log(
        `[generateImageContent] Generated ${imagePrompts.length} image prompts (${promptsOnly ? 'prompts-only' : 'execute now'})`,
      );
      
      const urls: string[] = [];
      
      for (let i = 0; i < imagePrompts.length; i++) {
        const imagePrompt = imagePrompts[i];
        
        // Phase 1: store prompts only
        if (promptsOnly) {
          const buffer = Buffer.from(imagePrompt, 'utf-8');
          const url = await this.storageService.uploadFile(buffer, {
            key: `${campaign._id}/images/prompt-${Date.now()}-${i}.txt`,
            contentType: 'text/plain',
            tenantId: campaign.tenantId.toString(),
            uploadedBy: 'system',
            tags: ['ai-generated', 'image-prompt', 'campaign-content', 'awaiting-execution'],
          });
          urls.push(url);
          continue;
        }

        // Step 2: For each prompt, generate the actual image
        // Note: Poe API supports DALL-E 3 and other image models
        // If image generation fails, we save the prompt as fallback
        try {
          // Try to generate actual image using image-capable model
          // Poe API will return image URL or base64 encoded image
          const imageResponse = await this.poeClient.generateContent('creative-image', {
            model: 'DALL-E-3', // Poe supports DALL-E 3
            contents: `Create a high-quality social media image: ${imagePrompt}`,
          });

          // Check if response contains an image URL or data
          if (this.isImageUrl(imageResponse)) {
            // If Poe returns a URL, save it directly
            urls.push(imageResponse.trim());
            this.logger.log(`[generateImageContent] Image ${i + 1} generated: ${imageResponse}`);
          } else {
            // If no image URL, save the prompt as a placeholder
            const buffer = Buffer.from(imagePrompt, 'utf-8');
            const url = await this.storageService.uploadFile(buffer, {
              key: `${campaign._id}/images/prompt-${Date.now()}-${i}.txt`,
              contentType: 'text/plain',
              tenantId: campaign.tenantId.toString(),
              uploadedBy: 'system',
              tags: ['ai-generated', 'image-prompt', 'campaign-content', 'needs-generation'],
            });
            urls.push(url);
            this.logger.warn(`[generateImageContent] Image ${i + 1} generation returned prompt instead of image`);
          }
        } catch (imageError) {
          // Fallback: save prompt if image generation fails
          this.logger.warn(`[generateImageContent] Failed to generate image ${i + 1}, saving prompt as fallback`);
          const buffer = Buffer.from(imagePrompt, 'utf-8');
          const url = await this.storageService.uploadFile(buffer, {
            key: `${campaign._id}/images/prompt-${Date.now()}-${i}.txt`,
            contentType: 'text/plain',
            tenantId: campaign.tenantId.toString(),
            uploadedBy: 'system',
              tags: ['ai-generated', 'image-prompt', 'campaign-content', 'generation-failed'],
          });
          urls.push(url);
        }
      }

      return urls;
    } catch (error) {
      this.logger.error('[generateImageContent] Failed to generate image content', error);
      throw new BadRequestException('Failed to generate image content');
    }
  }

  private async generateVideoContent(
    campaign: CampaignDocument,
    aiModel?: string,
    promptsOnly = true,
  ): Promise<string[]> {
    const strategy = campaign.strategyVersions[campaign.strategyVersions.length - 1];
    
    const prompt = this.buildVideoGenerationPrompt(campaign, strategy);
    
    try {
      // Generate comprehensive video scripts with AI
      const response = await this.poeClient.generateContent('creative-video', {
        model: aiModel || 'GPT-4o',
        contents: prompt,
      });

      // Parse into structured video scripts
      const videoScripts = this.parseVideoScripts(response);
      this.logger.log(
        `[generateVideoContent] Generated ${videoScripts.length} video scripts (${promptsOnly ? 'prompts-only' : 'execute now'})`,
      );
      
      const urls: string[] = [];
      for (let i = 0; i < videoScripts.length; i++) {
        const script = videoScripts[i];
        
        // Enhance script with additional metadata for video generation tools
        const enhancedScript = {
          ...script,
          campaign: {
            name: campaign.name,
            platforms: strategy.platforms,
            brandTone: strategy.brandTone,
          },
          metadata: {
            duration: this.estimateVideoDuration(script),
            format: this.detectVideoFormat(strategy.platforms),
            aspectRatio: this.getAspectRatio(strategy.platforms),
            generatedAt: new Date().toISOString(),
          },
          // Add visual scene descriptions for video generation APIs (Synthesia, Runway, etc.)
          scenes: this.generateSceneDescriptions(script, strategy),
          // Add voiceover suggestions
          voiceover: {
            tone: strategy.brandTone || 'professional',
            pacing: 'moderate',
            suggestions: this.generateVoiceoverNotes(script, strategy),
          },
          // Add music/sound suggestions
          audio: {
            backgroundMusic: this.suggestBackgroundMusic(strategy.brandTone),
            soundEffects: this.suggestSoundEffects(script),
          },
        };
        
        const buffer = Buffer.from(JSON.stringify(enhancedScript, null, 2), 'utf-8');
        const url = await this.storageService.uploadFile(buffer, {
          key: `${campaign._id}/videos/script-${Date.now()}-${i}.json`,
          contentType: 'application/json',
          tenantId: campaign.tenantId.toString(),
          uploadedBy: 'system',
          tags: promptsOnly
            ? ['ai-generated', 'video-script', 'campaign-content', 'awaiting-execution']
            : ['ai-generated', 'video-script', 'campaign-content', 'production-ready'],
        });
        urls.push(url);
        this.logger.log(`[generateVideoContent] Video script ${i + 1} saved: ${url}`);
      }

      return urls;
    } catch (error) {
      this.logger.error('[generateVideoContent] Failed to generate video content', error);
      throw new BadRequestException('Failed to generate video content');
    }
  }

  private buildTextGenerationPrompt(campaign: CampaignDocument, strategy: any): string {
    return `Generate 5 social media captions for a campaign with the following details:

Campaign Name: ${campaign.name}
Platforms: ${strategy.platforms.join(', ')}
Goals: ${strategy.goals.join(', ')}
Target Audience: ${strategy.targetAudience}
Brand Tone: ${strategy.brandTone}
Content Pillars: ${strategy.contentPillars.join(', ')}

Generate engaging, platform-appropriate captions. Each caption should be on a new line, numbered 1-5.`;
  }

  private buildImageGenerationPrompt(campaign: CampaignDocument, strategy: any): string {
    return `Generate 3 detailed image generation prompts for a campaign with the following details:

Campaign Name: ${campaign.name}
Brand Tone: ${strategy.brandTone}
Content Pillars: ${strategy.contentPillars.join(', ')}

Each prompt should describe a compelling visual that aligns with the campaign strategy. Format as numbered list 1-3.`;
  }

  private buildVideoGenerationPrompt(campaign: CampaignDocument, strategy: any): string {
    return `Generate 2 short video scripts for a campaign with the following details:

Campaign Name: ${campaign.name}
Goals: ${strategy.goals.join(', ')}
Target Audience: ${strategy.targetAudience}
Brand Tone: ${strategy.brandTone}

Each script should include: Hook, Body, and Outro. Format as JSON array.`;
  }

  private parseTextResponse(response: string): string[] {
    // Split by numbered lines
    const lines = response.split('\n').filter(line => line.trim());
    return lines.map(line => line.replace(/^\d+\.\s*/, '').trim()).filter(line => line);
  }

  private parseImagePrompts(response: string): string[] {
    const lines = response.split('\n').filter(line => line.trim());
    return lines.map(line => line.replace(/^\d+\.\s*/, '').trim()).filter(line => line);
  }

  private parseVideoScripts(response: string): any[] {
    try {
      return JSON.parse(response);
    } catch {
      // Fallback parsing - split by script markers
      const scripts = response.split(/Script \d+:/i).filter(s => s.trim());
      return scripts.map(script => ({
        hook: script.substring(0, 100),
        body: script.substring(100, 300),
        outro: script.substring(300),
      }));
    }
  }

  /**
   * Check if response contains an image URL
   */
  private isImageUrl(text: string): boolean {
    const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|bmp)/i;
    return urlPattern.test(text.trim());
  }

  /**
   * Estimate video duration based on script length
   */
  private estimateVideoDuration(script: any): string {
    const totalText = JSON.stringify(script).length;
    // Rough estimate: 150 words per minute = ~2.5 characters per second
    const seconds = Math.ceil(totalText / 2.5);
    return `${Math.min(seconds, 60)}s`; // Cap at 60 seconds for social media
  }

  /**
   * Detect optimal video format based on platforms
   */
  private detectVideoFormat(platforms: string[]): string {
    if (platforms.includes('TikTok') || platforms.includes('Instagram')) {
      return 'vertical'; // 9:16 for Stories/Reels/TikTok
    } else if (platforms.includes('YouTube')) {
      return 'horizontal'; // 16:9 for YouTube
    }
    return 'square'; // 1:1 for general social media
  }

  /**
   * Get aspect ratio based on platforms
   */
  private getAspectRatio(platforms: string[]): string {
    if (platforms.includes('TikTok') || platforms.includes('Instagram')) {
      return '9:16';
    } else if (platforms.includes('YouTube')) {
      return '16:9';
    }
    return '1:1';
  }

  /**
   * Generate visual scene descriptions for video production
   */
  private generateSceneDescriptions(script: any, strategy: any): any[] {
    const scenes = [];
    
    if (script.hook) {
      scenes.push({
        type: 'hook',
        duration: '3s',
        visuals: 'Attention-grabbing opening shot',
        text: script.hook,
        transition: 'fast-cut',
      });
    }
    
    if (script.body) {
      scenes.push({
        type: 'body',
        duration: '10-15s',
        visuals: `${strategy.contentPillars?.[0] || 'Product'} showcase with ${strategy.brandTone || 'professional'} styling`,
        text: script.body,
        transition: 'smooth',
      });
    }
    
    if (script.outro) {
      scenes.push({
        type: 'outro',
        duration: '3s',
        visuals: 'Call-to-action with brand logo',
        text: script.outro,
        transition: 'fade',
      });
    }
    
    return scenes;
  }

  /**
   * Generate voiceover notes
   */
  private generateVoiceoverNotes(script: any, strategy: any): string[] {
    const notes = [];
    const tone = strategy.brandTone?.toLowerCase() || 'professional';
    
    if (tone.includes('casual') || tone.includes('friendly')) {
      notes.push('Use conversational, warm tone');
      notes.push('Speak at moderate pace with natural inflections');
    } else if (tone.includes('professional') || tone.includes('authoritative')) {
      notes.push('Use confident, clear delivery');
      notes.push('Maintain steady, measured pace');
    } else if (tone.includes('energetic') || tone.includes('exciting')) {
      notes.push('Use enthusiastic, upbeat tone');
      notes.push('Faster pace with emphasis on key points');
    } else {
      notes.push('Use neutral, engaging tone');
    }
    
    return notes;
  }

  /**
   * Suggest background music based on brand tone
   */
  private suggestBackgroundMusic(brandTone?: string): string {
    const tone = brandTone?.toLowerCase() || 'professional';
    
    if (tone.includes('energetic') || tone.includes('exciting')) {
      return 'upbeat-electronic';
    } else if (tone.includes('calm') || tone.includes('relaxing')) {
      return 'ambient-chill';
    } else if (tone.includes('professional') || tone.includes('corporate')) {
      return 'corporate-uplifting';
    } else if (tone.includes('fun') || tone.includes('playful')) {
      return 'fun-quirky';
    }
    
    return 'neutral-background';
  }

  /**
   * Suggest sound effects based on script content
   */
  private suggestSoundEffects(script: any): string[] {
    const effects: string[] = [];
    const scriptText = JSON.stringify(script).toLowerCase();
    
    if (scriptText.includes('notification') || scriptText.includes('alert')) {
      effects.push('notification-ping');
    }
    if (scriptText.includes('success') || scriptText.includes('achievement')) {
      effects.push('success-chime');
    }
    if (scriptText.includes('transition') || scriptText.includes('next')) {
      effects.push('whoosh-transition');
    }
    
    return effects;
  }

  /**
   * Replace an asset in a content version while preserving other assets
   */
  async replaceAsset(
    campaignId: string,
    tenantId: string,
    contentVersion: number,
    oldAssetUrl: string,
    newAssetUrl: string,
    userId: string,
    skipApprovalInvalidation: boolean = false,
  ): Promise<CampaignDocument> {
    const campaign = await this.campaignModel.findOne({
      _id: campaignId,
      tenantId,
    }).exec();

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
    }

    const content = campaign.contentVersions?.find(c => c.version === contentVersion);
    if (!content) {
      throw new BadRequestException(`Content version ${contentVersion} not found`);
    }

    // Find and replace the asset in the appropriate array
    let assetFound = false;
    let assetType = '';

    if (content.textAssets?.includes(oldAssetUrl)) {
      content.textAssets = content.textAssets.map(url => url === oldAssetUrl ? newAssetUrl : url);
      assetFound = true;
      assetType = 'text';
    } else if (content.imageAssets?.includes(oldAssetUrl)) {
      content.imageAssets = content.imageAssets.map(url => url === oldAssetUrl ? newAssetUrl : url);
      assetFound = true;
      assetType = 'image';
    } else if (content.videoAssets?.includes(oldAssetUrl)) {
      content.videoAssets = content.videoAssets.map(url => url === oldAssetUrl ? newAssetUrl : url);
      assetFound = true;
      assetType = 'video';
    }

    if (!assetFound) {
      throw new BadRequestException(`Asset ${oldAssetUrl} not found in content version ${contentVersion}`);
    }

    // Update R2 storage: mark old as replaced
    try {
      await this.storageService.replaceAsset(oldAssetUrl, newAssetUrl, tenantId);
    } catch (err) {
      this.logger.warn(`[replaceAsset] Failed to update asset replacement in storage`, {
        error: (err as Error).message,
      });
      // Don't fail; R2 update is secondary
    }

    // Mark content as needs review unless explicitly skipped
    if (!skipApprovalInvalidation && !content.needsReview) {
      content.needsReview = true;
    }

    // Add revision record
    const now = new Date();
    campaign.revisionHistory.push({
      revision: (campaign.revisionHistory?.length || 0) + 1,
      changedAt: now,
      changedBy: userId,
      changes: {
        assetReplaced: {
          type: assetType,
          oldUrl: oldAssetUrl,
          newUrl: newAssetUrl,
          contentVersion,
        },
      },
      note: `Replaced ${assetType} asset in content version ${contentVersion}`,
    });

    await campaign.save();

    this.logger.log(`[replaceAsset] Asset replaced successfully`, {
      campaignId,
      contentVersion,
      assetType,
      oldAssetUrl,
      newAssetUrl,
    });

    return campaign;
  }
}
