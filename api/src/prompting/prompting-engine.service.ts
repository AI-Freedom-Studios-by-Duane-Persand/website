import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CampaignDocument } from '../models/campaign.schema';
import { StrategyDocument } from '../models/strategy.model';
import { CreativeDocument } from '../creatives/schemas/creative.schema';

export interface Prompt {
  id: string;
  field: string;
  question: string;
  context: string;
  recommendation?: string;
  options?: string[];
  priority: 'high' | 'medium' | 'low';
  category: 'missing' | 'conflicting' | 'low_confidence' | 'suggestion';
}

@Injectable()
export class PromptingEngineService {
  private readonly logger = new Logger(PromptingEngineService.name);

  constructor(
    @InjectModel('Campaign') private readonly campaignModel: Model<CampaignDocument>,
    @InjectModel('Creative') private readonly creativeModel: Model<CreativeDocument>,
  ) {}

  /**
   * Evaluate campaign for missing or incomplete inputs
   */
  async evaluateCampaign(campaignId: string): Promise<Prompt[]> {
    const campaign = await this.campaignModel.findById(campaignId).exec();
    if (!campaign) {
      return [];
    }

    const prompts: Prompt[] = [];

    // Check strategy completeness
    const strategyVersion = campaign.strategyVersions?.[campaign.strategyVersions.length - 1];
    if (!strategyVersion) {
      prompts.push({
        id: 'strategy-missing',
        field: 'strategy',
        question: 'Your campaign needs a strategy defined. Would you like to create one?',
        context: 'A strategy is required to guide content creation and scheduling.',
        recommendation: 'Define your target platforms, goals, and brand tone.',
        priority: 'high',
        category: 'missing',
      });
    } else {
      // Check for incomplete strategy fields
      if (!strategyVersion.platforms || strategyVersion.platforms.length === 0) {
        prompts.push({
          id: 'strategy-platforms-missing',
          field: 'strategyVersions[].platforms',
          question: 'Which platforms will you be posting to?',
          context: 'Platform selection affects content format and messaging.',
          options: ['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'Twitter'],
          priority: 'high',
          category: 'missing',
        });
      }

      if (!strategyVersion.targetAudience || strategyVersion.targetAudience.trim() === '') {
        prompts.push({
          id: 'strategy-audience-missing',
          field: 'strategyVersions[].targetAudience',
          question: 'Who is your target audience?',
          context: 'A clear audience definition helps tailor messaging.',
          priority: 'high',
          category: 'missing',
        });
      }

      if (!strategyVersion.contentPillars || strategyVersion.contentPillars.length === 0) {
        prompts.push({
          id: 'strategy-pillars-missing',
          field: 'strategyVersions[].contentPillars',
          question: 'What are your main content pillars?',
          context: 'Content pillars ensure consistency across campaigns.',
          recommendation: 'Define 3-5 main topics for your content.',
          priority: 'medium',
          category: 'missing',
        });
      }
    }

    // Check content status
    const contentVersion = campaign.contentVersions?.[campaign.contentVersions.length - 1];
    if (!contentVersion) {
      prompts.push({
        id: 'content-missing',
        field: 'contentVersions',
        question: 'You haven\'t created any content yet. Ready to generate content?',
        context: 'Create text, image, or video content for your campaign.',
        priority: 'high',
        category: 'missing',
      });
    } else {
      if (contentVersion.textAssets && contentVersion.textAssets.length > 0 && contentVersion.imageAssets?.length === 0) {
        prompts.push({
          id: 'content-images-missing',
          field: 'contentVersions[].imageAssets',
          question: 'You have copy but no images. Would you like to generate or upload images?',
          context: 'Visuals improve engagement rates significantly.',
          priority: 'medium',
          category: 'missing',
        });
      }

      if (contentVersion.videoAssets?.length === 0 && strategyVersion?.platforms?.includes('TikTok')) {
        prompts.push({
          id: 'content-video-recommended',
          field: 'contentVersions[].videoAssets',
          question: 'TikTok performs best with video content. Would you like to create a video?',
          context: 'Video content drives higher engagement on TikTok.',
          priority: 'high',
          category: 'suggestion',
        });
      }
    }

    // Check for conflicting configurations
    if (strategyVersion?.cadence && strategyVersion.cadence.includes('daily') && campaign.schedule?.length < 7) {
      prompts.push({
        id: 'schedule-conflict',
        field: 'schedule',
        question: 'Your cadence is daily but you have fewer than 7 scheduled posts. This may not be sufficient.',
        context: 'Content gaps can reduce audience engagement.',
        priority: 'medium',
        category: 'conflicting',
      });
    }

    this.logger.log(`[evaluateCampaign] Campaign evaluation complete: ${prompts.length} prompts`, {
      campaignId,
      promptCount: prompts.length,
    });

    return prompts;
  }

  /**
   * Generate context-aware recommendation
   */
  async getRecommendation(campaignId: string, fieldPath: string): Promise<string | undefined> {
    const campaign = await this.campaignModel.findById(campaignId).exec();
    if (!campaign) {
      return undefined;
    }

    const strategyVersion = campaign.strategyVersions?.[campaign.strategyVersions.length - 1];

    // Example: Generate recommendations based on context
    const recommendations: Record<string, string> = {
      'strategyVersions[].cadence': this.recommendCadence(strategyVersion?.platforms || []),
      'strategyVersions[].brandTone': this.recommendBrandTone(strategyVersion?.targetAudience || ''),
      'contentVersions[].imageAssets': 'Generate 3-5 variations of images to A/B test performance.',
    };

    return recommendations[fieldPath];
  }

  private recommendCadence(platforms: string[]): string {
    if (platforms.includes('TikTok')) {
      return 'TikTok success requires daily posting. Consider a cadence of 1-3 posts per day.';
    }
    if (platforms.includes('Instagram')) {
      return 'Instagram performs well with 3-5 posts per week. Consider a balanced cadence.';
    }
    return '5-7 posts per week is a good baseline for most platforms.';
  }

  private recommendBrandTone(audience: string): string {
    if (audience.toLowerCase().includes('gen z') || audience.toLowerCase().includes('youth')) {
      return 'Gen Z audiences respond to casual, authentic, and humorous brand tones.';
    }
    if (audience.toLowerCase().includes('b2b') || audience.toLowerCase().includes('enterprise')) {
      return 'B2B audiences prefer professional, educational, and thought-leadership tones.';
    }
    return 'Ensure your brand tone aligns with your audience\'s values and preferences.';
  }

  /**
   * Record user response to a prompt
   */
  async recordPromptResponse(campaignId: string, promptId: string, response: 'skip' | 'accept' | 'provide' | 'later', value?: any): Promise<void> {
    const campaign = await this.campaignModel.findById(campaignId).exec();
    if (!campaign) {
      return;
    }

    if (!campaign.metadata) {
      (campaign as any).metadata = {};
    }
    if (!(campaign as any).metadata.promptResponses) {
      (campaign as any).metadata.promptResponses = [];
    }

    (campaign as any).metadata.promptResponses.push({
      promptId,
      response,
      value,
      respondedAt: new Date(),
    });

    await campaign.save();

    this.logger.log(`[recordPromptResponse] Prompt response recorded: ${promptId}`, {
      response,
      campaignId,
    });
  }

  /**
   * Get skipped prompts for campaign
   */
  async getSkippedPrompts(campaignId: string): Promise<string[]> {
    const campaign = await this.campaignModel.findById(campaignId).exec();
    if (!campaign) {
      return [];
    }

    const responses = (campaign as any).metadata?.promptResponses || [];
    return responses
      .filter((r: any) => r.response === 'skip')
      .map((r: any) => r.promptId);
  }

  /**
   * Surface skipped prompts before publishing
   */
  async getPublishingBlockers(campaignId: string): Promise<{ blockers: string[]; skipped: string[] }> {
    const evaluation = await this.evaluateCampaign(campaignId);
    const skipped = await this.getSkippedPrompts(campaignId);

    // High-priority prompts that are skipped become blockers
    const blockers = evaluation
      .filter(p => p.priority === 'high' && skipped.includes(p.id))
      .map(p => p.question);

    return {
      blockers,
      skipped: skipped.filter(id => evaluation.find(p => p.id === id && p.priority === 'medium')),
    };
  }
}
