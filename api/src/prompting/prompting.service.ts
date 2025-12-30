import { Injectable, Logger } from '@nestjs/common';
import { StrategyDocument } from '../models/strategy.model';
import { CampaignDocument } from '../models/campaign.schema';

export interface PromptItem {
  id: string;
  field: string;
  title: string;
  description: string;
  type: 'required' | 'recommended' | 'conflict';
  currentValue?: any;
  suggestedValue?: any;
  options?: Array<{ label: string; value: any }>;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface PromptResponse {
  promptId: string;
  response: 'skip' | 'accept' | 'provide';
  value?: any;
  respondedAt: Date;
}

@Injectable()
export class PromptingService {
  private readonly logger = new Logger(PromptingService.name);

  /**
   * Evaluate strategy for missing inputs and conflicts
   */
  evaluateStrategy(strategy: StrategyDocument): PromptItem[] {
    const prompts: PromptItem[] = [];

    // Check for required fields
    if (!strategy.platforms || strategy.platforms.length === 0) {
      prompts.push({
        id: 'strategy-platforms',
        field: 'platforms',
        title: 'Select Target Platforms',
        description: 'Which social platforms will this campaign target?',
        type: 'required',
        currentValue: strategy.platforms,
        priority: 'high',
        reason: 'No platforms selected for the campaign',
        options: [
          { label: 'Instagram', value: 'instagram' },
          { label: 'Facebook', value: 'facebook' },
          { label: 'TikTok', value: 'tiktok' },
          { label: 'Twitter/X', value: 'twitter' },
          { label: 'LinkedIn', value: 'linkedin' },
          { label: 'YouTube', value: 'youtube' },
        ],
      });
    }

    if (!strategy.goals || strategy.goals.length === 0) {
      prompts.push({
        id: 'strategy-goals',
        field: 'goals',
        title: 'Define Campaign Goals',
        description: 'What are the primary objectives of this campaign?',
        type: 'required',
        priority: 'high',
        reason: 'Campaign goals not specified',
        options: [
          { label: 'Increase Brand Awareness', value: 'awareness' },
          { label: 'Drive Website Traffic', value: 'traffic' },
          { label: 'Lead Generation', value: 'leads' },
          { label: 'Increase Sales', value: 'sales' },
          { label: 'Community Engagement', value: 'engagement' },
        ],
      });
    }

    if (!strategy.targetAudience || strategy.targetAudience.trim() === '') {
      prompts.push({
        id: 'strategy-audience',
        field: 'targetAudience',
        title: 'Describe Target Audience',
        description: 'Who is the intended audience for this campaign?',
        type: 'required',
        priority: 'high',
        reason: 'Target audience not defined',
      });
    }

    if (!strategy.contentPillars || strategy.contentPillars.length === 0) {
      prompts.push({
        id: 'strategy-pillars',
        field: 'contentPillars',
        title: 'Define Content Pillars',
        description: 'What are the main themes or topics for content?',
        type: 'required',
        priority: 'high',
        reason: 'Content pillars not specified',
      });
    }

    if (!strategy.brandTone || strategy.brandTone.trim() === '') {
      prompts.push({
        id: 'strategy-tone',
        field: 'brandTone',
        title: 'Set Brand Tone',
        description: 'What tone should the content use? (e.g., professional, casual, humorous)',
        type: 'recommended',
        priority: 'medium',
        reason: 'Brand tone helps maintain consistency',
        options: [
          { label: 'Professional', value: 'professional' },
          { label: 'Casual', value: 'casual' },
          { label: 'Humorous', value: 'humorous' },
          { label: 'Inspirational', value: 'inspirational' },
          { label: 'Educational', value: 'educational' },
        ],
      });
    }

    if (!strategy.cadence || strategy.cadence.trim() === '') {
      prompts.push({
        id: 'strategy-cadence',
        field: 'cadence',
        title: 'Set Publishing Cadence',
        description: 'How often should content be published?',
        type: 'required',
        priority: 'high',
        reason: 'Publishing schedule not defined',
        options: [
          { label: 'Daily', value: 'daily' },
          { label: '3x per week', value: '3xweek' },
          { label: 'Weekly', value: 'weekly' },
          { label: 'Bi-weekly', value: 'biweekly' },
          { label: 'Monthly', value: 'monthly' },
        ],
      });
    }

    // Check for low-confidence values (optional but recommended)
    if (strategy.targetAudience && strategy.targetAudience.trim().length < 20) {
      prompts.push({
        id: 'strategy-audience-detail',
        field: 'targetAudience',
        title: 'Expand Audience Description',
        description: 'Provide more detail about your target audience demographics, interests, behaviors',
        type: 'recommended',
        priority: 'medium',
        reason: 'More detailed audience description improves content targeting',
        currentValue: strategy.targetAudience,
      });
    }

    // Check for conflict if ads enabled but budget not set
    if (strategy.adsConfig?.enabled && !strategy.adsConfig?.budget) {
      prompts.push({
        id: 'strategy-ads-budget',
        field: 'adsConfig.budget',
        title: 'Set Ads Budget',
        description: 'What is the budget for paid ads in this campaign?',
        type: 'conflict',
        priority: 'high',
        reason: 'Ads are enabled but no budget is set',
      });
    }

    this.logger.log(`[evaluateStrategy] Generated ${prompts.length} prompts for strategy`, {
      strategyId: strategy._id,
      promptCount: prompts.length,
    });

    return prompts;
  }

  /**
   * Evaluate campaign for missing inputs
   */
  evaluateCampaign(campaign: CampaignDocument): PromptItem[] {
    const prompts: PromptItem[] = [];

    // Check if strategy is complete
    const latestStrategy = campaign.strategyVersions?.[campaign.strategyVersions.length - 1];
    if (!latestStrategy) {
      prompts.push({
        id: 'campaign-strategy',
        field: 'strategy',
        title: 'Create Campaign Strategy',
        description: 'Define the campaign strategy before proceeding',
        type: 'required',
        priority: 'high',
        reason: 'Campaign requires a strategy',
      });
    }

    // Check if content exists
    const latestContent = campaign.contentVersions?.[campaign.contentVersions.length - 1];
    if (!latestContent || latestContent.textAssets?.length === 0) {
      prompts.push({
        id: 'campaign-content',
        field: 'content',
        title: 'Generate or Upload Content',
        description: 'Create or upload content for this campaign',
        type: 'required',
        priority: 'high',
        reason: 'Campaign has no content',
      });
    }

    // Check if schedule is created
    if (!campaign.schedule || campaign.schedule.length === 0) {
      prompts.push({
        id: 'campaign-schedule',
        field: 'schedule',
        title: 'Create Publishing Schedule',
        description: 'Set up the schedule for when content will be published',
        type: 'required',
        priority: 'high',
        reason: 'Campaign has no publishing schedule',
      });
    }

    // Check if assets are linked
    if (!campaign.assetRefs || campaign.assetRefs.length === 0) {
      prompts.push({
        id: 'campaign-assets',
        field: 'assets',
        title: 'Attach Campaign Assets',
        description: 'Upload or link images, videos, and other assets for the campaign',
        type: 'recommended',
        priority: 'medium',
        reason: 'No assets linked to campaign yet',
      });
    }

    this.logger.log(`[evaluateCampaign] Generated ${prompts.length} prompts for campaign`, {
      campaignId: campaign._id,
      promptCount: prompts.length,
    });

    return prompts;
  }

  /**
   * Generate platform-specific prompts
   */
  generatePlatformPrompts(
    platforms: string[],
    existingPrompts: PromptItem[] = [],
  ): PromptItem[] {
    const platformPrompts: PromptItem[] = [];

    const platformRequirements: Record<string, PromptItem> = {
      instagram: {
        id: 'platform-instagram-hashtags',
        field: 'instagramHashtags',
        title: 'Instagram Hashtag Strategy',
        description: 'Define hashtag strategy for Instagram posts',
        type: 'recommended',
        priority: 'medium',
        reason: 'Hashtags improve Instagram discoverability',
      },
      tiktok: {
        id: 'platform-tiktok-trends',
        field: 'tiktokTrends',
        title: 'TikTok Trend Integration',
        description: 'Identify trending sounds and formats for TikTok',
        type: 'recommended',
        priority: 'medium',
        reason: 'Trending content performs better on TikTok',
      },
      linkedin: {
        id: 'platform-linkedin-formatting',
        field: 'linkedinFormatting',
        title: 'LinkedIn Content Format',
        description: 'Should posts use carousel, article, or standard format?',
        type: 'recommended',
        priority: 'medium',
        reason: 'Content format affects LinkedIn engagement',
      },
      youtube: {
        id: 'platform-youtube-seo',
        field: 'youtubeSEO',
        title: 'YouTube SEO Keywords',
        description: 'Define keywords and tags for YouTube videos',
        type: 'recommended',
        priority: 'medium',
        reason: 'SEO improves video discoverability',
      },
    };

    for (const platform of platforms) {
      const requirement = platformRequirements[platform];
      if (requirement && !existingPrompts.some(p => p.id === requirement.id)) {
        platformPrompts.push(requirement);
      }
    }

    return platformPrompts;
  }

  /**
   * Track user responses to prompts
   */
  recordResponse(campaignId: string, response: PromptResponse): void {
    this.logger.log(`[recordResponse] Prompt response recorded`, {
      campaignId,
      promptId: response.promptId,
      response: response.response,
    });
  }

  /**
   * Suggest values based on historical data
   */
  suggestValues(field: string, context: any): string[] {
    const suggestions: Record<string, string[]> = {
      contentPillars: [
        'Product Updates',
        'Customer Stories',
        'Industry Insights',
        'Behind the Scenes',
        'Tips & Tricks',
        'Announcements',
      ],
      brandTone: [
        'Professional & Authoritative',
        'Friendly & Casual',
        'Humorous & Witty',
        'Inspirational & Motivational',
        'Educational & Informative',
      ],
      goals: [
        'Increase Brand Awareness',
        'Drive Website Traffic',
        'Generate Leads',
        'Increase Sales',
        'Build Community',
        'Improve Customer Loyalty',
      ],
    };

    return suggestions[field] || [];
  }
}
