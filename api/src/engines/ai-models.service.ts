import { Injectable, Inject } from '@nestjs/common';
import { Logger } from 'winston';
import { PoeClient } from './poe.client';

@Injectable()
export class AIModelsService {
  private readonly logger: Logger;

  private readonly models = [
    { name: 'GPT-4o', description: "OpenAI's latest model" },
    { name: 'Claude-Sonnet-4', description: "Anthropic's most capable model" },
    { name: 'Gemini-2.5-Pro', description: "Google's flagship model" },
    { name: 'Llama-3.1-405B', description: "Meta's largest open-source model" },
    { name: 'Grok-4', description: "xAI's latest model" },
  ];

  constructor(
    private readonly poeClient: PoeClient,
    @Inject('winston') logger: Logger
  ) {
    this.logger = logger.child({ context: AIModelsService.name });
  }

  getAvailableModels() {
    return this.models;
  }

  async listModels(): Promise<{ id: string; name: string }[]> {
    try {
      this.logger.info('Fetching AI models from Poe API');
      const models = await this.poeClient.listModels();

      // Map models to id-name pairs
      const aiModels = models.map((model) => ({ id: model, name: model }));

      this.logger.info('AI models fetched successfully', { count: aiModels.length });
      return aiModels;
    } catch (error) {
      this.logger.error('Error fetching AI models', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error('Failed to fetch AI models. Please try again later.');
    }
  }

  async generateContent(engineType: string, input: { model: string; contents: string }): Promise<string> {
    try {
      this.logger.info(`Generating content using engine: ${engineType}`, { input });
      const content = await this.poeClient.generateContent(engineType, input);

      this.logger.info('Content generated successfully');
      return content;
    } catch (error) {
      this.logger.error('Error generating content', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error('Failed to generate content. Please try again later.');
    }
  }
}