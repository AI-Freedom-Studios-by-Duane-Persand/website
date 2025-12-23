import { Injectable, Inject, forwardRef, LoggerService } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CampaignSessionDocument } from '../models/campaignSession.schema';
import { CampaignMessageDocument } from '../models/campaignMessage.schema';
import { campaignChatSteps, CampaignChatStep } from '../engines/campaignChatSteps';
import { extractParamsFromText } from '../engines/parameterExtractor';
import { generateRecommendations } from '../engines/recommendations';
import { StorageService } from '../storage/storage.service';
import { WebsiteInsightsService } from '../integrations/website-insights.service';
import { PoeClient } from '../engines/poe.client';
import { CampaignsService } from '../campaigns/campaigns.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AIExtractorService } from '../engines/ai-extractor.service';
import { CreativesService } from '../creatives/creatives.service';

// Map chat step keys to canonical strategy keys for state persistence and progression.
const STEP_FIELD_MAP: Record<string, string> = {
  campaignName: 'name',
  businessGoals: 'objective',
  brandVoice: 'brandTone',
  keyMessages: 'contentPillars',
};

const STEP_ALIAS_PAIRS: Array<[string, string]> = [
  ['campaignName', 'name'],
  ['businessGoals', 'objective'],
  ['brandVoice', 'brandTone'],
  ['keyMessages', 'contentPillars'],
];

// Fallback, single-line suggestions when Poe API fails.
const FALLBACK_RECOMMENDATIONS: Record<string, string> = {
  campaignName: 'Use a memorable, outcome-driven name like "Q1 Growth Push".',
  businessGoals: 'Pick one KPI focus, e.g., "Increase qualified leads by 25%".',
  targetAudience: 'Define age, location, role, and pain point, e.g., "US SaaS founders needing faster activation".',
  platforms: 'Choose 2-3 channels your audience uses most, e.g., LinkedIn + Instagram.',
  budget: 'Set a realistic total, e.g., $5k with 30% reserved for paid.',
  duration: 'Keep a clear window, e.g., 8 weeks.',
  contentPillars: 'List 3-5 pillars, e.g., Proof, Education, Product, Community.',
  brandVoice: 'Pick a consistent tone, e.g., "confident, concise, optimistic".',
  competitorInsights: 'Call out 1-2 gaps competitors miss, e.g., weak onboarding proof.',
  keyMessages: 'Share 2-3 crisp messages, e.g., "Launch faster", "Onboard smoothly", "Grow retention".',
  successMetrics: 'Tie to KPIs, e.g., "35% lift in demo requests; CTR > 2.5%".',
  postingCadence: 'Choose sustainable cadence, e.g., 4 posts/week per channel.',
  contentFormats: 'Mix formats your audience engages with, e.g., Reels + carousels + short blog.',
  paidAdvertising: 'Allocate a % to ads, e.g., 25% to retargeting and lookalikes.',
  existingAssets: 'List what you have: logo pack, product shots, testimonials, case studies.',
  constraints: 'Add guardrails, e.g., "No discounts", "Tone: direct", "Max 120 chars".',
};

@Injectable()
export class CampaignChatService {
  constructor(
    @InjectModel('CampaignSession') private sessionModel: Model<CampaignSessionDocument>,
    @InjectModel('CampaignMessage') private messageModel: Model<CampaignMessageDocument>,
    private readonly poeClient: PoeClient, // Inject PoeClient for AI recommendations
    @Inject(forwardRef(() => CampaignsService)) private readonly campaignsService: CampaignsService,
    private readonly storage: StorageService,
    private readonly websiteInsights: WebsiteInsightsService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
    private readonly aiExtractor: AIExtractorService,
    private readonly creativesService: CreativesService,
  ) {}

  private isStepSatisfied(state: Record<string, any>, stepKey: string): boolean {
    const canonical = STEP_FIELD_MAP[stepKey];
    const direct = state?.[stepKey];
    const mapped = canonical ? state?.[canonical] : undefined;
    return (direct != null && direct !== '') || (mapped != null && mapped !== '');
  }

  private syncStepAliases(state: Record<string, any>) {
    STEP_ALIAS_PAIRS.forEach(([a, b]) => {
      if (state[a] != null && state[b] == null) state[b] = state[a];
      if (state[b] != null && state[a] == null) state[a] = state[b];
    });
  }

  async startSession(campaignId: string, userId: string, tenantId: string): Promise<any> {
    this.logger.log(`[startSession] Called with campaignId=${String(campaignId)}, userId=${String(userId)}, tenantId=${String(tenantId)}`);
    if (!tenantId) {
      this.logger.error('[startSession] Missing tenantId (required from authenticated user)');
      throw new Error('tenantId is required to start a campaign session');
    }
    try {
      let initialState = {};
      let linkedCampaignId: any = undefined;

      // Check if editing existing campaign
      if (campaignId && campaignId !== 'new') {
        this.logger.log(`[startSession] Loading existing campaign: ${campaignId}`);
        const campaign = await this.campaignsService.findOne(campaignId, tenantId);
        if (campaign) {
          // Extract from latest strategy version
          const latestStrategy = campaign.strategyVersions?.length > 0
            ? campaign.strategyVersions[campaign.strategyVersions.length - 1]
            : null;

          // Hydrate state from existing campaign
          initialState = {
            name: campaign.name,
            campaignName: campaign.name,
            objective: latestStrategy?.goals?.[0] || '',
            businessGoals: latestStrategy?.goals?.[0] || '',
            targetAudience: latestStrategy?.targetAudience || '',
            budget: null, // Legacy field, not in new schema
            postingCadence: latestStrategy?.cadence || '',
            platforms: latestStrategy?.platforms || [],
            duration: '', // Legacy field
            websiteUrl: '', // Legacy field
            brandTone: latestStrategy?.brandTone || '',
            brandVoice: latestStrategy?.brandTone || '',
            contentPillars: latestStrategy?.contentPillars || [],
            keyMessages: latestStrategy?.contentPillars || [],
          };
          linkedCampaignId = campaign._id;
          this.logger.log(`[startSession] Loaded campaign state: ${JSON.stringify(initialState)}`);
        }
      }

      this.syncStepAliases(initialState as Record<string, any>);

      // If editing, try to reuse the latest session so the full conversation history is preserved
      let session: CampaignSessionDocument | null = null;
      if (linkedCampaignId) {
        session = await this.sessionModel
          .findOne({ campaignId: linkedCampaignId, tenantId })
          .sort({ updatedAt: -1 });
        if (session) {
          this.logger.log(`[startSession] Reusing existing session ${String(session._id)} for campaign ${String(linkedCampaignId)}`);
          const existingState = session.state ? JSON.parse(session.state) : {};
          const mergedState = { ...initialState, ...existingState };
          this.syncStepAliases(mergedState);
          session = await this.sessionModel.findByIdAndUpdate(
            session._id,
            { state: JSON.stringify(mergedState), updatedAt: new Date() },
            { new: true },
          ) as CampaignSessionDocument;
          initialState = mergedState;
        }
      }

      // IMPORTANT: For new campaigns, creation is DEFERRED until user completes all steps
      // For existing campaigns with no prior session, create one and link immediately
      if (!session) {
        this.logger.log(`[startSession] Creating session ${linkedCampaignId ? 'WITH' : 'WITHOUT'} campaign link`);
        session = await this.sessionModel.create({ 
          campaignId: linkedCampaignId,
          userId,
          tenantId,
          state: JSON.stringify(initialState),
        });
        this.logger.log(`[startSession] Session created with ID=${String(session._id)}`);
      }
      
      // Return session + first unanswered step
      const firstStep = await this.getCurrentStep(session);
      if (!firstStep) {
        // All steps already filled (editing complete campaign)
        const firstStepFallback = campaignChatSteps[0];
        return {
          sessionId: session._id,
          firstPrompt: `Campaign loaded. What would you like to update?\n\n${firstStepFallback.prompt}`,
          firstConsideration: firstStepFallback.consideration,
          firstStepKey: firstStepFallback.key,
          extracted: initialState,
        };
      }
      
      return {
        sessionId: session._id,
        firstPrompt: firstStep.prompt,
        firstConsideration: firstStep.consideration,
        firstStepKey: firstStep.key,
        extracted: initialState,
      };
    } catch (err) {
      const error = err as Error;
      this.logger.error(`[startSession] Error: ${error.message}`, error.stack);
      throw err;
    }
  }

  async addMessage(sessionId: string, sender: 'user' | 'system', message: string, step?: string): Promise<CampaignMessageDocument> {
    this.logger.log(`[addMessage] sessionId=${String(sessionId)}, sender=${String(sender)}, step=${String(step || 'N/A')}, message=${String(message)}`);
    return this.messageModel.create({ sessionId, sender, message, step: step || '' });
  }

  async getSessionMessages(sessionId: string): Promise<CampaignMessageDocument[]> {
    this.logger.log(`[getSessionMessages] sessionId=${String(sessionId)}`);
    return this.messageModel.find({ sessionId }).sort({ createdAt: 1 });
  }

  async getSession(sessionId: string): Promise<CampaignSessionDocument | null> {
    this.logger.log(`[getSession] sessionId=${String(sessionId)}`);
    return this.sessionModel.findById(sessionId);
  }

  async updateSessionState(sessionId: string, state: any): Promise<CampaignSessionDocument | null> {
    this.logger.log(`[updateSessionState] sessionId=${String(sessionId)}, state=${JSON.stringify(state)}`);
    return this.sessionModel.findByIdAndUpdate(sessionId, { state: JSON.stringify(state), updatedAt: new Date() }, { new: true });
  }

  async getCurrentStep(session: CampaignSessionDocument): Promise<CampaignChatStep | null> {
    const state = session.state ? JSON.parse(session.state) : {};
    this.syncStepAliases(state);
    for (const step of campaignChatSteps) {
      if (!this.isStepSatisfied(state, step.key)) {
        this.logger.log(`[getCurrentStep] Next step: ${String(step.key)}`);
        return step;
      }
    }
    this.logger.log('[getCurrentStep] All steps complete');
    return null; // All steps complete
  }

  async getAIRecommendation(step: CampaignChatStep, state: any): Promise<string> {
    // Compose a prompt for the AI based on the step and current state
    const context = Object.entries(state)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    const aiPrompt = `Suggest a value for the following campaign field based on context.\nField: ${step.key}\nPrompt: ${step.prompt}\nContext:\n${context}`;
    this.logger.log(`[getAIRecommendation] step=${String(step.key)}, prompt=${String(aiPrompt)}`);
    try {
      const aiResult = await this.poeClient.generateContent('strategy', { model: 'GPT-4o', contents: aiPrompt });
      const singleLine = String(aiResult || '').replace(/\s+/g, ' ').trim();
      this.logger.log(`[getAIRecommendation] AI result (single line): ${singleLine}`);
      return singleLine || this.buildFallback(step);
    } catch (e) {
      const err = e as any;
      const code = err?.status || err?.response?.status;
      this.logger.error(`[getAIRecommendation] Error: ${(e as Error)?.message}`, (e as Error)?.stack);
      const fallback = this.buildFallback(step, code);
      return fallback;
    }
  }

  private buildFallback(step: CampaignChatStep, statusCode?: number): string {
    const base = FALLBACK_RECOMMENDATIONS[step.key] || 'Keep it short, specific, and aligned to your primary goal.';
    return statusCode ? `${base} (fallback; model ${statusCode})` : base;
  }

  async handleUserInput(sessionId: string, userInput: string, options?: { skip?: boolean; recommend?: boolean }): Promise<{ prompt: string; consideration: string; stepKey: string; done: boolean; error?: string; aiRecommendation?: string; insights?: any[]; extracted?: Record<string, any> }> {
    this.logger.log(`[handleUserInput] sessionId=${String(sessionId)}, userInput=${String(userInput)}, options=${JSON.stringify(options)}`);
    const session = await this.getSession(sessionId);
    if (!session) {
      this.logger.error(`[handleUserInput] Session not found for sessionId=${String(sessionId)}`);
      return { prompt: '', consideration: '', stepKey: '', done: true, error: 'Session not found' };
    }
    const state = session.state ? JSON.parse(session.state) : {};
    this.syncStepAliases(state);
    
    // ALWAYS run dual extraction on user input (before any step checks)
    let extracted: any = {};
    
    if (userInput && userInput.trim()) {
      this.logger.log(`[handleUserInput] Starting extraction for: "${userInput.substring(0, 60)}..."`);
      
      // 1. Regex-based extraction (fast, deterministic)
      const regexExtracted = extractParamsFromText(userInput);
      this.logger.log(`[handleUserInput] Regex extracted: ${JSON.stringify(regexExtracted)}`);
      
      // 2. AI-powered extraction (context-aware, conversational)
      try {
        const conversationHistory = await this.getSessionMessages(sessionId);
        const aiExtracted = await this.aiExtractor.extractFromConversation(
          userInput,
          conversationHistory.map(m => ({ sender: m.sender, message: m.message })),
          state,
        );
        this.logger.log(`[handleUserInput] AI extracted: ${JSON.stringify(aiExtracted)}`);
        
        // Merge both (AI takes precedence for richer fields)
        extracted = { ...regexExtracted, ...aiExtracted };
        
        if (Object.keys(extracted || {}).length) {
          this.logger.log(`[handleUserInput] Merging ${Object.keys(extracted).length} extracted fields into state`);
          this.mergeState(state, extracted);
          const enhancedState = this.aiExtractor.mergeWithState(state, aiExtracted);
          Object.assign(state, enhancedState);
          this.syncStepAliases(state);
          await this.updateSessionState(sessionId, state);
          
          // Log what's now in state for debugging
          const stateKeys = Object.keys(state).filter(k => !k.startsWith('_') && state[k] != null && state[k] !== '');
          this.logger.log(`[handleUserInput] State now has: ${stateKeys.join(', ')}`);
        } else {
          this.logger.warn(`[handleUserInput] No parameters extracted from user input`);
        }
      } catch (extractError) {
        this.logger.error(`[handleUserInput] Extraction pipeline failed: ${(extractError as Error).message}`);
        // Continue with regex-only if AI extraction fails
        if (Object.keys(regexExtracted || {}).length) {
          extracted = regexExtracted;
          this.mergeState(state, extracted);
          this.syncStepAliases(state);
          await this.updateSessionState(sessionId, state);
        }
      }
    }
    
    // Generate proactive insights after every user input and persist deduped in state
    const insights = generateRecommendations(state);
    const mergedInsights = this.mergeInsights(state.insights || [], insights);
    if (mergedInsights.length !== (state.insights || []).length) {
      state.insights = mergedInsights;
      await this.updateSessionState(sessionId, state);
    }
    
    const currentStep = await this.getCurrentStep(session);
    if (!currentStep) {
      const stateNow = session.state ? JSON.parse(session.state) : {};
      // If in asset generation phase, handle choices and produce outputs
      if (stateNow._assetGenerationPhase) {
        const result = await this.handleAssetGeneration(session, stateNow, userInput);
        return result;
      }
      this.logger.log('[handleUserInput] All strategy steps complete, transitioning to asset generation');
      
      // Create campaign from session state
      if (!session.campaignId) {
        await this.createCampaignFromSession(session, stateNow);
      } else {
        await this.updateCampaignFromSession(session, stateNow);
      }
      
      // Mark that we're entering asset generation phase
      stateNow._assetGenerationPhase = true;
      await this.updateSessionState(sessionId, stateNow);
      
      // Prompt user for AI-powered asset generation
      const assetPrompt = `🎉 Campaign strategy complete! Now let's create compelling content.\n\nWould you like me to generate:\n1. Social media posts (captions + hashtags)\n2. Ad creatives (headlines + descriptions)\n3. Visual content ideas\n4. All of the above\n\nReply with a number (1-4) or describe what you need.`;
      
      this.logger.log('[handleUserInput] Transitioning to asset generation phase');
      return {
        prompt: assetPrompt,
        consideration: 'AI can generate content tailored to your strategy using Poe models.',
        stepKey: 'assetGeneration',
        done: false,
        insights,
        extracted: extracted as any,
        // surface campaignId for frontend to fetch creatives
        ...(session.campaignId ? { campaignId: String(session.campaignId) } : {}),
      };
    }

    // Handle skip
    if (options?.skip && currentStep.skippable) {
      this.logger.log(`[handleUserInput] Skipping step: ${String(currentStep.key)}`);
      const canonicalKey = STEP_FIELD_MAP[currentStep.key] || currentStep.key;
      state[currentStep.key] = '__SKIPPED__';
      if (!state[canonicalKey]) state[canonicalKey] = '__SKIPPED__';
      this.syncStepAliases(state);
      await this.updateSessionState(sessionId, state);
      const nextStep = campaignChatSteps.find(s => !this.isStepSatisfied(state, s.key));
      if (nextStep) {
        this.logger.log(`[handleUserInput] Next step after skip: ${String(nextStep.key)}`);
        const skipInsights = generateRecommendations(state);
        return {
          prompt: nextStep.prompt,
          consideration: nextStep.consideration,
          stepKey: nextStep.key,
          done: false,
          insights: skipInsights,
          extracted: extracted as any,
        };
      }
      this.logger.log('[handleUserInput] No more steps after skip');
      return { prompt: '', consideration: '', stepKey: '', done: true, insights, extracted: extracted as any };
    }
    // Handle AI recommendation
    if (options?.recommend && currentStep.acceptsRecommendation) {
      this.logger.log(`[handleUserInput] Requesting AI recommendation for step: ${String(currentStep.key)}`);
      const aiRecommendation = await this.getAIRecommendation(currentStep, state);
      return {
        prompt: currentStep.prompt,
        consideration: currentStep.consideration,
        stepKey: currentStep.key,
        done: false,
        aiRecommendation,
        insights,
        extracted: extracted as any,
      };
    }
    // Basic validation: required field
    if (currentStep.required && (!userInput || userInput.trim() === '')) {
      this.logger.warn(`[handleUserInput] Required field missing for step: ${String(currentStep.key)}`);
      return {
        prompt: currentStep.prompt,
        consideration: currentStep.consideration,
        stepKey: currentStep.key,
        done: false,
        error: 'This field is required.',
        insights,
        extracted: extracted as any,
      };
    }
    // Save input (or extracted value for this step if present)
    this.logger.log(`[handleUserInput] Saving input for step: ${String(currentStep.key)}`);
    
    const stateKey = STEP_FIELD_MAP[currentStep.key] || currentStep.key;
    const valueToPersist = state[stateKey] ?? userInput;
    state[stateKey] = valueToPersist;
    if (state[currentStep.key] == null) state[currentStep.key] = valueToPersist;
    this.syncStepAliases(state);
    
    await this.updateSessionState(sessionId, state);
    const updatedInsights = generateRecommendations(state);
    // Advance to next step
    const nextStep = campaignChatSteps.find(s => !this.isStepSatisfied(state, s.key));
    if (nextStep) {
      this.logger.log(`[handleUserInput] Next step: ${String(nextStep.key)}`);
      return {
        prompt: nextStep.prompt,
        consideration: nextStep.consideration,
        stepKey: nextStep.key,
        done: false,
        insights: updatedInsights,
        extracted: extracted as any,
      };
    }
    this.logger.log('[handleUserInput] All strategy steps complete after input');
    
    // Check if we've already started asset generation phase
    if (state._assetGenerationPhase) {
      // If the user just replied while in asset phase, process their choice via handler
      const assetResult = await this.handleAssetGeneration(session, state, userInput);
      return assetResult;
    }
    
    // Strategy complete: save campaign, then transition to asset generation
    if (session.campaignId) {
      await this.updateCampaignFromSession(session, state);
    } else {
      await this.createCampaignFromSession(session, state);
    }
    
    // Mark that we're entering asset generation phase
    state._assetGenerationPhase = true;
    await this.updateSessionState(sessionId, state);
    
    // Prompt user for AI-powered asset generation
    const assetPrompt = `🎉 Campaign strategy complete! Now let's create compelling content.\n\nWould you like me to generate:\n1. Social media posts (captions + hashtags)\n2. Ad creatives (headlines + descriptions)\n3. Visual content ideas\n4. All of the above\n\nReply with a number (1-4) or describe what you need.`;
    
    this.logger.log('[handleUserInput] Transitioning to asset generation phase');
    return {
      prompt: assetPrompt,
      consideration: 'AI can generate content tailored to your strategy using Poe models.',
      stepKey: 'assetGeneration',
      done: false,
      insights: updatedInsights,
      extracted: extracted as any,
      // surface campaignId for frontend to fetch creatives
      ...(session.campaignId ? { campaignId: String(session.campaignId) } : {}),
    };
  }

  private async handleAssetGeneration(session: CampaignSessionDocument, state: any, userInput: string): Promise<{ prompt: string; consideration: string; stepKey: string; done: boolean; error?: string; insights?: any[]; extracted?: Record<string, any>; campaignId?: string; generated?: any[] }>{
    const choiceText = (userInput || '').toLowerCase();
    const campaignId = String(session.campaignId || '')
    if (!campaignId) {
      // No campaign linked yet; prompt user to finalize strategy
      return {
        prompt: 'We need a campaign linked before generating assets. Please complete the strategy steps.',
        consideration: '',
        stepKey: 'assetGeneration',
        done: false,
      };
    }
    const tenantId = String(session.tenantId);
    const model = 'gpt-4o';
    // Build guidance from state
    const guidance = {
      brandTone: state.brandTone,
      targetAudience: state.targetAudience,
      contentPillars: state.contentPillars,
    };
    const basePrompt = `Generate assets aligned to the campaign strategy.\nName: ${state.name || state.campaignName}\nGoals: ${Array.isArray(state.objective) ? state.objective.join(', ') : state.objective}\nAudience: ${state.targetAudience}\nTone: ${state.brandTone}\nPillars: ${Array.isArray(state.contentPillars) ? state.contentPillars.join(', ') : state.contentPillars}`;

    const generated: any[] = [];
    const wantsText = /^\s*1/.test(choiceText) || choiceText.includes('caption') || choiceText.includes('post') || choiceText.includes('hashtag') || choiceText.includes('text') || choiceText.includes('all');
    const wantsImage = /^\s*2/.test(choiceText) || choiceText.includes('ad') || choiceText.includes('image') || choiceText.includes('visual') || choiceText.includes('all');
    const wantsVideo = /^\s*3/.test(choiceText) || choiceText.includes('video') || choiceText.includes('script') || choiceText.includes('all');
    if (!wantsText && !wantsImage && !wantsVideo) {
      return {
        prompt: 'Please reply with 1 (text), 2 (image), 3 (video), or 4 (all).',
        consideration: 'You can also type keywords like “captions”, “visual ideas”, or “video script”.',
        stepKey: 'assetGeneration',
        done: false,
        campaignId,
      };
    }
    try {
      if (wantsText) {
        const text = await this.creativesService.generateTextCreative({ tenantId, campaignId, model, prompt: `${basePrompt}\nTask: Social captions + hashtags`, platforms: state.platforms || [], guidance });
        generated.push(text);
      }
      if (wantsImage) {
        const image = await this.creativesService.generateImageCreative({ tenantId, campaignId, model, prompt: `${basePrompt}\nTask: Visual concept prompts`, layoutHint: 'social-first', platforms: state.platforms || [] });
        generated.push(image);
      }
      if (wantsVideo) {
        const video = await this.creativesService.generateVideoCreative({ tenantId, campaignId, model, prompt: `${basePrompt}\nTask: Short social video script`, platforms: state.platforms || [] });
        generated.push(video);
      }
      const summary = `Generated ${generated.length} creative${generated.length === 1 ? '' : 's'}. Open the creatives panel to review, attach uploads, or regenerate.`;
      await this.addMessage(String(session._id), 'system', summary, 'assetGeneration');
      return {
        prompt: 'Would you like to regenerate any asset with a prompt, or upload images/videos to attach? You can also generate more content.',
        consideration: 'Use the creatives panel to manage assets. Regeneration keeps strategy context.',
        stepKey: 'assetGeneration',
        done: false,
        campaignId,
        generated,
      };
    } catch (err) {
      const e = err as Error;
      this.logger.error(`[handleAssetGeneration] Failed: ${e.message}`, e.stack);
      return {
        prompt: 'Generation failed. Please try a different choice or prompt.',
        consideration: 'If the issue persists, check model availability or network.',
        stepKey: 'assetGeneration',
        done: false,
        campaignId,
        error: e.message,
      };
    }
  }

  // Utility for controller: list creatives for a session's campaign
  async listCreativesForSession(sessionId: string): Promise<any[]> {
    const session = await this.getSession(sessionId);
    if (!session?.campaignId) return [];
    const list = await this.creativesService.findAll({ campaignId: String(session.campaignId) });
    return list;
  }

  // Utility for controller: generate assets via session (no tenantId in body needed)
  async generateAssetsViaSession(sessionId: string, kind: 'text' | 'image' | 'video' | 'all', prompt?: string, model?: string): Promise<any[]> {
    const session = await this.getSession(sessionId);
    if (!session?.campaignId) return [];
    const tenantId = String(session.tenantId);
    const campaignId = String(session.campaignId);
    const state = session.state ? JSON.parse(session.state) : {};
    const modelName = model || 'gpt-4o';
    const platforms = state.platforms || [];
    const basePrompt = prompt || `Generate assets aligned to campaign: ${state.name || state.campaignName}`;
    const out: any[] = [];
    if (kind === 'text' || kind === 'all') {
      out.push(await this.creativesService.generateTextCreative({ tenantId, campaignId, model: modelName, prompt: `${basePrompt}\nTask: Social captions + hashtags`, platforms, guidance: { brandTone: state.brandTone, targetAudience: state.targetAudience, contentPillars: state.contentPillars } }));
    }
    if (kind === 'image' || kind === 'all') {
      out.push(await this.creativesService.generateImageCreative({ tenantId, campaignId, model: modelName, prompt: `${basePrompt}\nTask: Visual concept prompts`, layoutHint: 'social-first', platforms }));
    }
    if (kind === 'video' || kind === 'all') {
      out.push(await this.creativesService.generateVideoCreative({ tenantId, campaignId, model: modelName, prompt: `${basePrompt}\nTask: Short social video script`, platforms }));
    }
    return out;
  }

  private mergeState(state: any, extracted: any) {
    if (!extracted) return;
    const map = {
      budget: 'budget',
      postingCadence: 'postingCadence',
      duration: 'duration',
      platforms: 'platforms',
      websiteUrl: 'websiteUrl',
      paidAdvertisingPercent: 'paidAdvertisingPercent',
      targetAudience: 'targetAudience',
      objective: 'objective',
      campaignName: 'name',
      businessGoals: 'objective',
      brandVoice: 'brandTone',
      brandTone: 'brandTone',
      contentPillars: 'contentPillars',
      keyMessages: 'contentPillars',
      successMetrics: 'successMetrics',
      contentFormats: 'contentFormats',
      startDate: 'startDate',
      endDate: 'endDate',
    } as Record<string, string>;
    
    for (const [k, v] of Object.entries(extracted)) {
      if (k === 'custom' && typeof v === 'object') {
        state.constraints = { ...(state.constraints || {}), ...(v as any) };
      } else if (map[k]) {
        const targetKey = map[k];
        // Only set if not already filled
        if (state[targetKey] == null || state[targetKey] === '' || 
            (Array.isArray(state[targetKey]) && state[targetKey].length === 0)) {
          state[targetKey] = v;
        }
        // Also set the source key for alias consistency
        if (state[k] == null || state[k] === '' || 
            (Array.isArray(state[k]) && state[k].length === 0)) {
          state[k] = v;
        }
      }
    }
  }

  private mergeInsights(existing: any[], next: any[]): any[] {
    const map = new Map<string, any>();
    [...(existing || []), ...(next || [])].forEach((ins) => {
      const title = typeof ins === 'string' ? ins : ins?.title || JSON.stringify(ins);
      const detail = typeof ins === 'string' ? '' : ins?.detail || ins?.description || '';
      const key = `${title}|${detail}`;
      if (!map.has(key)) map.set(key, ins);
    });
    // Cap to avoid unbounded growth; keep most recent items
    const all = Array.from(map.values());
    return all.slice(-25);
  }

  async attachWebsite(sessionId: string, url: string) {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');
    const state = session.state ? JSON.parse(session.state) : {};
    const info = await this.websiteInsights.fetchBasicInsights(url);
    state.websiteUrl = url;
    state.website = info;
    
    // Extract insights if available and merge into state
    const insights: any[] = [];
    if (info?.title) insights.push({ title: info.title, type: 'website', detail: info.description || '' });
    if (info?.description) insights.push({ title: 'Description', type: 'website', detail: info.description });
    if (info?.keywords) {
      const keywords = Array.isArray(info.keywords) ? info.keywords.join(', ') : info.keywords;
      insights.push({ title: 'Keywords', type: 'website', detail: keywords });
    }
    state.insights = this.mergeInsights(state.insights || [], insights);
    await this.updateSessionState(sessionId, state);
    return { ...info, insights: state.insights };
  }

  async attachAssets(sessionId: string, files: Express.Multer.File[], tenantId?: string) {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');
    const state = session.state ? JSON.parse(session.state) : {};
    const uploaded: { url: string; filename: string; creativeId?: string }[] = [];
    
    // Ensure campaign is linked for asset creation
    if (!session.campaignId) {
      // If no campaign yet, just store in session for later attachment
      const tempUploaded: any[] = [];
      for (const f of files) {
        const key = `${session.tenantId}/${Date.now()}_${f.originalname}`;
        const url = await this.storage.uploadFile(f.buffer, key, f.mimetype, String(tenantId || session.tenantId));
        tempUploaded.push({ url, filename: f.originalname });
      }
      state.existingAssets = [...(state.existingAssets || []), ...tempUploaded];
      await this.updateSessionState(sessionId, state);
      return tempUploaded;
    }

    // Campaign is linked: create Creative documents for uploads
    const campaignId = String(session.campaignId);
    for (const f of files) {
      const key = `${session.tenantId}/${Date.now()}_${f.originalname}`;
      const url = await this.storage.uploadFile(f.buffer, key, f.mimetype, String(tenantId || session.tenantId));
      
      // Determine creative type based on MIME type
      let creativeType: 'image' | 'video' | 'text' = 'image';
      if (f.mimetype.startsWith('video/')) {
        creativeType = 'video';
      } else if (!f.mimetype.startsWith('image/')) {
        creativeType = 'text';
      }

      // Create a Creative document for this upload
      const creativeDto: any = {
        type: creativeType,
        campaignId: campaignId,
        tenantId: String(session.tenantId),
        status: 'draft',
        createdBy: String(session.userId),
        metadata: {
          tags: ['uploaded'],
          uploadedFilename: f.originalname,
          uploadedMimetype: f.mimetype,
        },
      };

      // Add asset to creative based on type
      if (creativeType === 'image') {
        creativeDto.visual = {
          imageUrl: url,
          thumbnailUrl: url,
        };
      } else if (creativeType === 'video') {
        creativeDto.assets = {
          videoUrl: url,
        };
      }

      try {
        const creative = await this.creativesService.create(creativeDto);
        uploaded.push({ url, filename: f.originalname, creativeId: String(creative._id) });
        this.logger.log(`[attachAssets] Created Creative ${String(creative._id)} for uploaded file ${f.originalname}`);
      } catch (err) {
        this.logger.error(`[attachAssets] Failed to create Creative for ${f.originalname}: ${(err as Error).message}`);
        // Still return the upload URL even if Creative creation failed
        uploaded.push({ url, filename: f.originalname });
      }
    }

    state.existingAssets = [...(state.existingAssets || []), ...uploaded];
    await this.updateSessionState(sessionId, state);
    return uploaded;
  }

  private async createCampaignFromSession(session: CampaignSessionDocument, state: any): Promise<void> {
    this.logger.log(`[createCampaignFromSession] Creating campaign from session state`);
    try {
      const campaignName = state.name || state.campaignName || `Campaign-${session._id}`;
      this.logger.log(`[createCampaignFromSession] Creating campaign: ${campaignName} with strategy state`);
      
      // Build initial strategy version from collected data
      const initialStrategy = {
        version: 1,
        createdAt: new Date(),
        createdBy: String(session.userId),
        platforms: state.platforms || [],
        goals: state.objective ? [state.objective] : [],
        targetAudience: state.targetAudience || '',
        contentPillars: state.contentPillars || [],
        brandTone: state.brandTone || state.tone || '',
        constraints: state.constraints || '',
        cadence: state.postingCadence || 'daily',
        adsConfig: state.paidAdvertisingPercent ? { paidPercent: state.paidAdvertisingPercent } : undefined,
        invalidated: false,
        insights: state.insights || [],
      };

      // Build campaign data with initial strategy version
      const campaignDto: any = {
        name: campaignName,
        status: 'draft',
        createdBy: String(session.userId),
        tenantId: session.tenantId,
        strategyVersions: [initialStrategy],
      };

      const campaign = await this.campaignsService.create(campaignDto);
      
      // Link campaign to session
      await this.sessionModel.findByIdAndUpdate(session._id, { campaignId: campaign._id });
      this.logger.log(`[createCampaignFromSession] Campaign created with ID=${campaign._id} and linked to session`);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`[createCampaignFromSession] Error creating campaign: ${error.message}`, error.stack);
      // Don't throw - campaign creation failed but session succeeded, log for later retry
    }
  }

  private async updateCampaignFromSession(session: CampaignSessionDocument, state: any): Promise<void> {
    this.logger.log(`[updateCampaignFromSession] Updating campaign ${session.campaignId} from session state`);
    try {
      // Build new strategy version from updated state
      const strategyData = {
        platforms: state.platforms || [],
        goals: state.objective ? [state.objective] : [],
        targetAudience: state.targetAudience || '',
        contentPillars: state.contentPillars || [],
        brandTone: state.brandTone || state.tone || '',
        constraints: state.constraints || '',
        cadence: state.postingCadence || 'daily',
        adsConfig: state.paidAdvertisingPercent ? { paidPercent: state.paidAdvertisingPercent } : undefined,
        insights: state.insights || [],
      };

      // Add new strategy version (this will auto-invalidate dependent content)
      await this.campaignsService.addStrategyVersion(
        String(session.campaignId),
        strategyData,
        String(session.userId),
        'Updated via campaign chat',
        session.tenantId as any
      );

      // Update campaign name if changed
      if (state.name || state.campaignName) {
        await this.campaignsService.update(
          String(session.campaignId),
          { name: state.name || state.campaignName } as any,
          session.tenantId as any
        );
      }

      this.logger.log(`[updateCampaignFromSession] Campaign ${session.campaignId} updated with new strategy version`);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`[updateCampaignFromSession] Error updating campaign: ${error.message}`, error.stack);
    }
  }
}
