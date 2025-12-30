// api/src/campaigns/services/prompting.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CampaignDocument } from '../../models/campaign.schema';
import { PoeClient } from '../../engines/poe.client';

export interface CampaignPrompt {
  field: string;
  section: 'strategy' | 'content' | 'schedule' | 'ads';
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
  aiGenerated: boolean;
  canSkip: boolean;
  order: number;
}

export interface PromptResolution {
  field: string;
  action: 'provide' | 'accept' | 'skip';
  value?: any;
}

@Injectable()
export class PromptingService {
  private readonly logger = new Logger(PromptingService.name);

  // Field configuration with prompting rules
  private readonly fieldRules = {
    strategy: {
      platforms: { required: true, canInfer: true, order: 1 },
      goals: { required: true, canInfer: true, order: 2 },
      targetAudience: { required: true, canInfer: false, order: 3 },
      contentPillars: { required: true, canInfer: true, order: 4 },
      brandTone: { required: true, canInfer: true, order: 5 },
      cadence: { required: true, canInfer: false, order: 6 },
      constraints: { required: false, canInfer: false, order: 7 },
      adsConfig: { required: false, canInfer: false, order: 8 },
    },
    content: {
      mode: { required: true, canInfer: false, order: 1 },
      textAssets: { required: false, canInfer: false, order: 2 },
      imageAssets: { required: false, canInfer: false, order: 3 },
      videoAssets: { required: false, canInfer: false, order: 4 },
      aiModel: { required: false, canInfer: false, order: 5 },
    },
    schedule: {
      slots: { required: true, canInfer: true, order: 1 },
      platforms: { required: true, canInfer: false, order: 2 },
    },
  };

  constructor(
    @InjectModel('Campaign') private readonly campaignModel: Model<CampaignDocument>,
    private readonly poeClient: PoeClient,
  ) {}

  /**
   * Evaluate campaign and generate context-aware prompts
   */
  async evaluateCampaign(campaignId: string, tenantId: string): Promise<CampaignPrompt[]> {
    const campaign = await this.campaignModel.findOne({ _id: campaignId, tenantId }).exec();
    
    if (!campaign) {
      return [];
    }

    const prompts: CampaignPrompt[] = [];

    // Evaluate strategy
    const strategyPrompts = await this.evaluateStrategy(campaign);
    prompts.push(...strategyPrompts);

    // Evaluate content
    const contentPrompts = await this.evaluateContent(campaign);
    prompts.push(...contentPrompts);

    // Evaluate schedule
    const schedulePrompts = await this.evaluateSchedule(campaign);
    prompts.push(...schedulePrompts);

    // Sort by section and order
    prompts.sort((a, b) => {
      const sectionOrder = { strategy: 1, content: 2, schedule: 3, ads: 4 };
      if (sectionOrder[a.section] !== sectionOrder[b.section]) {
        return sectionOrder[a.section] - sectionOrder[b.section];
      }
      return a.order - b.order;
    });

    this.logger.log(`[evaluateCampaign] Generated ${prompts.length} prompts for campaign ${campaignId}`);
    return prompts;
  }

  /**
   * Evaluate strategy section
   */
  private async evaluateStrategy(campaign: CampaignDocument): Promise<CampaignPrompt[]> {
    const prompts: CampaignPrompt[] = [];
    const latestStrategy = campaign.strategyVersions[campaign.strategyVersions.length - 1];

    if (!latestStrategy) {
      prompts.push({
        field: 'strategy',
        section: 'strategy',
        message: 'No strategy defined for this campaign',
        severity: 'error',
        aiGenerated: false,
        canSkip: false,
        order: 0,
      });
      return prompts;
    }

    // Check required fields
    for (const [field, rules] of Object.entries(this.fieldRules.strategy)) {
      const value = (latestStrategy as any)[field];
      
      if (rules.required && (!value || (Array.isArray(value) && value.length === 0))) {
        const suggestion = rules.canInfer 
          ? await this.generateSuggestion(field, 'strategy', campaign)
          : undefined;

        prompts.push({
          field,
          section: 'strategy',
          message: `Missing required field: ${this.humanizeField(field)}`,
          severity: 'error',
          suggestion,
          aiGenerated: !!suggestion,
          canSkip: false,
          order: rules.order,
        });
      } else if (rules.canInfer && value && typeof value === 'string' && value.length < 10) {
        // Warn about low-confidence values
        const suggestion = await this.generateSuggestion(field, 'strategy', campaign);
        
        prompts.push({
          field,
          section: 'strategy',
          message: `${this.humanizeField(field)} seems incomplete or vague`,
          severity: 'warning',
          suggestion,
          aiGenerated: true,
          canSkip: true,
          order: rules.order,
        });
      }
    }

    // Check for conflicts
    if (latestStrategy.platforms && latestStrategy.cadence) {
      const conflict = this.detectPlatformCadenceConflict(
        latestStrategy.platforms,
        latestStrategy.cadence
      );
      
      if (conflict) {
        prompts.push({
          field: 'cadence',
          section: 'strategy',
          message: conflict,
          severity: 'warning',
          aiGenerated: false,
          canSkip: true,
          order: 10,
        });
      }
    }

    return prompts;
  }

  /**
   * Evaluate content section
   */
  private async evaluateContent(campaign: CampaignDocument): Promise<CampaignPrompt[]> {
    const prompts: CampaignPrompt[] = [];
    const latestContent = campaign.contentVersions[campaign.contentVersions.length - 1];

    if (!latestContent) {
      prompts.push({
        field: 'content',
        section: 'content',
        message: 'No content created for this campaign',
        severity: 'error',
        aiGenerated: false,
        canSkip: false,
        order: 0,
      });
      return prompts;
    }

    // Check if content mode is set
    if (!latestContent.mode) {
      prompts.push({
        field: 'mode',
        section: 'content',
        message: 'Content creation mode not specified (AI, manual, or hybrid)',
        severity: 'error',
        aiGenerated: false,
        canSkip: false,
        order: 1,
      });
    }

    // Check if any assets are provided
    const hasAssets = (latestContent.textAssets && latestContent.textAssets.length > 0) ||
                     (latestContent.imageAssets && latestContent.imageAssets.length > 0) ||
                     (latestContent.videoAssets && latestContent.videoAssets.length > 0);

    if (!hasAssets) {
      prompts.push({
        field: 'assets',
        section: 'content',
        message: 'No content assets generated or uploaded',
        severity: 'error',
        suggestion: latestContent.mode === 'ai' 
          ? 'Would you like me to generate content based on your strategy?'
          : undefined,
        aiGenerated: latestContent.mode === 'ai',
        canSkip: false,
        order: 2,
      });
    }

    // Check if content needs review
    if (latestContent.needsReview) {
      prompts.push({
        field: 'review',
        section: 'content',
        message: 'Content has been flagged for review',
        severity: 'warning',
        aiGenerated: false,
        canSkip: false,
        order: 3,
      });
    }

    // Check if content is invalidated
    if (latestContent.invalidated) {
      prompts.push({
        field: 'invalidated',
        section: 'content',
        message: 'Content was invalidated due to strategy changes',
        severity: 'warning',
        suggestion: 'Regenerate content or mark as reviewed',
        aiGenerated: false,
        canSkip: false,
        order: 4,
      });
    }

    return prompts;
  }

  /**
   * Evaluate schedule section
   */
  private async evaluateSchedule(campaign: CampaignDocument): Promise<CampaignPrompt[]> {
    const prompts: CampaignPrompt[] = [];

    if (!campaign.schedule || campaign.schedule.length === 0) {
      prompts.push({
        field: 'schedule',
        section: 'schedule',
        message: 'No posts scheduled for this campaign',
        severity: 'error',
        suggestion: 'Would you like me to generate an optimal schedule based on your strategy?',
        aiGenerated: true,
        canSkip: false,
        order: 1,
      });
      return prompts;
    }

    // Check for conflicts
    const conflicts = campaign.schedule.filter(slot => slot.conflict);
    if (conflicts.length > 0) {
      prompts.push({
        field: 'conflicts',
        section: 'schedule',
        message: `${conflicts.length} scheduling conflict(s) detected`,
        severity: 'warning',
        suggestion: 'Review conflicting time slots and adjust',
        aiGenerated: false,
        canSkip: false,
        order: 2,
      });
    }

    // Check for overposting
    const overposting = this.detectOverposting(campaign.schedule);
    if (overposting) {
      prompts.push({
        field: 'overposting',
        section: 'schedule',
        message: overposting.message,
        severity: 'warning',
        suggestion: overposting.suggestion,
        aiGenerated: false,
        canSkip: true,
        order: 3,
      });
    }

    return prompts;
  }

  /**
   * Generate AI suggestion for a field
   */
  private async generateSuggestion(
    field: string,
    section: string,
    campaign: CampaignDocument
  ): Promise<string | undefined> {
    try {
      const context = this.buildContext(campaign, section);
      const prompt = `Based on the following campaign context, suggest a value for the "${field}" field:

${context}

Provide a concise, actionable suggestion (1-2 sentences max).`;

      const suggestion = await this.poeClient.generateContent('strategy', {
        model: 'GPT-4o',
        contents: prompt,
      });

      return suggestion.trim();
    } catch (error) {
      this.logger.error(`[generateSuggestion] Failed to generate suggestion for ${field}`, error);
      return undefined;
    }
  }

  /**
   * Build context string from campaign data
   */
  private buildContext(campaign: CampaignDocument, section: string): string {
    const parts: string[] = [];

    parts.push(`Campaign Name: ${campaign.name}`);

    const latestStrategy = campaign.strategyVersions[campaign.strategyVersions.length - 1];
    if (latestStrategy) {
      if (latestStrategy.platforms?.length) {
        parts.push(`Platforms: ${latestStrategy.platforms.join(', ')}`);
      }
      if (latestStrategy.goals?.length) {
        parts.push(`Goals: ${latestStrategy.goals.join(', ')}`);
      }
      if (latestStrategy.targetAudience) {
        parts.push(`Target Audience: ${latestStrategy.targetAudience}`);
      }
      if (latestStrategy.brandTone) {
        parts.push(`Brand Tone: ${latestStrategy.brandTone}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Detect platform-cadence conflicts
   */
  private detectPlatformCadenceConflict(platforms: string[], cadence: string): string | null {
    // Example: LinkedIn doesn't perform well with multiple daily posts
    if (platforms.includes('LinkedIn') && cadence.toLowerCase().includes('daily')) {
      return 'LinkedIn typically performs better with 2-3 posts per week rather than daily posting';
    }

    // Example: TikTok needs frequent posting
    if (platforms.includes('TikTok') && !cadence.toLowerCase().includes('daily')) {
      return 'TikTok algorithm favors daily posting for maximum reach';
    }

    return null;
  }

  /**
   * Detect overposting issues
   */
  private detectOverposting(schedule: any[]): { message: string; suggestion: string } | null {
    // Group by date and platform
    const postsByDateAndPlatform = new Map<string, Map<string, number>>();

    for (const slot of schedule) {
      const dateKey = new Date(slot.slot).toISOString().split('T')[0];
      
      if (!postsByDateAndPlatform.has(dateKey)) {
        postsByDateAndPlatform.set(dateKey, new Map());
      }
      
      const platformMap = postsByDateAndPlatform.get(dateKey)!;
      platformMap.set(slot.platform, (platformMap.get(slot.platform) || 0) + 1);
    }

    // Check for excessive posting on any date/platform
    for (const [date, platformMap] of postsByDateAndPlatform.entries()) {
      for (const [platform, count] of platformMap.entries()) {
        if (count > 5) {
          return {
            message: `${count} posts scheduled for ${platform} on ${date} (may overwhelm audience)`,
            suggestion: `Consider spreading posts across multiple days or reducing frequency`,
          };
        }
      }
    }

    return null;
  }

  /**
   * Humanize field names
   */
  private humanizeField(field: string): string {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Resolve a prompt (user provides value, accepts suggestion, or skips)
   */
  async resolvePrompt(
    campaignId: string,
    tenantId: string,
    resolution: PromptResolution
  ): Promise<CampaignDocument> {
    const campaign = await this.campaignModel.findOne({ _id: campaignId, tenantId }).exec();
    
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Apply the resolution based on action
    if (resolution.action === 'provide' || resolution.action === 'accept') {
      await this.applyFieldValue(campaign, resolution.field, resolution.value);
    }

    // Log resolution (even if skipped)
    campaign.revisionHistory.push({
      revision: (campaign.revisionHistory?.length || 0) + 1,
      changedAt: new Date(),
      changedBy: 'system',
      changes: { promptResolution: resolution },
      note: `Prompt ${resolution.action}: ${resolution.field}`,
    });

    await campaign.save();
    return campaign;
  }

  /**
   * Apply field value to campaign
   */
  private async applyFieldValue(campaign: CampaignDocument, field: string, value: any): Promise<void> {
    // Determine which section the field belongs to
    const latestStrategy = campaign.strategyVersions[campaign.strategyVersions.length - 1];
    const latestContent = campaign.contentVersions[campaign.contentVersions.length - 1];

    if (field in this.fieldRules.strategy && latestStrategy) {
      (latestStrategy as any)[field] = value;
    } else if (field in this.fieldRules.content && latestContent) {
      (latestContent as any)[field] = value;
    }
  }
}
