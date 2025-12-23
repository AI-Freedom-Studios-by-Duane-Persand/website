// api/src/engines/ai-extractor.service.ts
// AI-powered parameter extraction from natural conversation
import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PoeClient } from './poe.client';

export interface AIExtractedParams {
  campaignName?: string;
  objective?: string;
  businessGoals?: string;
  targetAudience?: string;
  platforms?: string[];
  budget?: number;
  duration?: string;
  postingCadence?: string;
  contentPillars?: string[];
  brandTone?: string;
  brandVoice?: string;
  keyMessages?: string[];
  successMetrics?: string[];
  contentFormats?: string[];
  competitorInsights?: string;
  paidAdvertisingPercent?: number;
  constraints?: string;
  [key: string]: any;
}

@Injectable()
export class AIExtractorService {
  constructor(
    private readonly poeClient: PoeClient,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  /**
   * Use AI to extract structured campaign parameters from natural conversation.
   * Falls back to empty object if AI fails.
   */
  async extractFromConversation(
    userMessage: string,
    conversationHistory: Array<{ sender: string; message: string }>,
    currentState: Record<string, any>,
  ): Promise<AIExtractedParams> {
    try {
      this.logger.log(`[AIExtractor] Extracting params from: "${userMessage.substring(0, 80)}..."`);

      // Build context from recent conversation
      const recentHistory = conversationHistory.slice(-5).map(m => `${m.sender}: ${m.message}`).join('\n');
      
      const extractionPrompt = `Extract campaign parameters from this message: "${userMessage}"

Context: ${recentHistory ? recentHistory.substring(0, 200) : 'First message'}

Return ONLY valid JSON (no markdown) with extracted fields (omit empty):
{
  "campaignName": "string",
  "objective": "string",
  "businessGoals": "string",
  "targetAudience": "string",
  "platforms": ["Instagram", "Facebook"],
  "budget": 5000,
  "duration": "3 months",
  "postingCadence": "daily" or "3x/week",
  "contentPillars": ["Education", "Proof"],
  "brandTone": "professional",
  "keyMessages": ["Fast", "Reliable"],
  "successMetrics": ["CTR", "conversions"],
  "contentFormats": ["Reels", "carousels"],
  "paidAdvertisingPercent": 30
}

JSON only:`;

      const aiResponse = await this.poeClient.generateContent('strategy', {
        model: 'GPT-4o',
        contents: extractionPrompt,
      });

      // Parse AI response as JSON with multiple fallback strategies
      let extracted: any = {};
      
      try {
        // Try cleaning markdown
        let cleaned = aiResponse.trim()
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim();
        
        // Try to extract JSON if wrapped in text
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleaned = jsonMatch[0];
        }
        
        extracted = JSON.parse(cleaned);
        this.logger.log(`[AIExtractor] Extracted ${Object.keys(extracted).length} fields: ${Object.keys(extracted).join(', ')}`);
      } catch (parseError) {
        this.logger.warn(`[AIExtractor] JSON parse failed, AI returned: ${aiResponse.substring(0, 100)}`);
        // Return empty object if parse fails
        return {};
      }
      
      return extracted as AIExtractedParams;
    } catch (error) {
      const err = error as any;
      this.logger.error(`[AIExtractor] Extraction failed (${err.status || 'unknown'}): ${err.message}`);
      return {};
    }
  }

  /**
   * Merge AI-extracted params with existing state, respecting existing values.
   */
  mergeWithState(state: Record<string, any>, extracted: AIExtractedParams): Record<string, any> {
    const merged = { ...state };
    
    for (const [key, value] of Object.entries(extracted)) {
      if (value != null && value !== '' && (!Array.isArray(value) || value.length > 0)) {
        // Only update if current state doesn't have a value or has empty/placeholder value
        const current = merged[key];
        const isEmpty = current == null || current === '' || current === '__SKIPPED__' || 
                       (Array.isArray(current) && current.length === 0);
        
        if (isEmpty) {
          merged[key] = value;
          this.logger.log(`[AIExtractor] Set ${key} = ${JSON.stringify(value)}`);
        } else {
          this.logger.log(`[AIExtractor] Kept existing ${key} = ${JSON.stringify(current)}`);
        }
      }
    }
    
    return merged;
  }
}
