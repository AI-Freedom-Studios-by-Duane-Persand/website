// api/src/engines/poe.client.ts
// PoeClient implementation using Poe.com API
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { createLogger, format, transports } from 'winston';

@Injectable()
export class PoeClient {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private logger;

  constructor() {
    const apiKey = process.env.POE_API_KEY;
    if (!apiKey) {
      throw new Error('Poe API key is missing');
    }
    this.apiKey = apiKey;

    // Initialize Winston logger
    this.logger = createLogger({
      level: 'info',
      format: format.combine(format.timestamp(), format.json()),
      transports: [
        new transports.Console(),
        new transports.File({ filename: 'logs/poe-client.log' }),
      ],
    });

    const apiUrl = process.env.POE_API_URL;
    if (!apiUrl) {
      throw new Error('Poe API URL is missing');
    }
    this.apiUrl = apiUrl;

    // Log the initialization of PoeClient
    const logger = new Logger(PoeClient.name);
    logger.log(`PoeClient initialized with API URL: ${this.apiUrl}`);
    logger.log(`PoeClient initialized with API Key: ${this.apiKey ? 'Loaded' : 'Missing'}`);
  }

  async generateContent(engineType: string, input: { model: string; contents: string }): Promise<string> {
    try {
      if (!input.model) {
        throw new Error('Model name is required for content generation');
      }

      this.logger.info(`[PoeClient] Generating content for engine: ${engineType} with model: ${input.model}`);
      const response = await axios.post(
        `${this.apiUrl}/generate`,
        {
          engine: engineType,
          input,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.data || !response.data.text) {
        throw new Error('Invalid response from Poe API');
      }

      this.logger.info(`[PoeClient] Content generated successfully`);
      return response.data.text;
    } catch (error: any) {
      this.logger.error(`[PoeClient] Error generating content`, {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new Error(`Failed to generate content using Poe API: ${error.message}`);
    }
  }

  async listModels(): Promise<string[]> {
    try {
      this.logger.info('[PoeClient] Using static list of models');

      // Updated to match Poe's latest public models (as of 2025)
      const staticModels = [
        'gpt-4o',
        'gpt-4',
        'gpt-3.5-turbo',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
        'llama-3-70b',
        'llama-3-8b',
        'gemini-1.5-pro',
        'grok-1',
      ];

      this.logger.info('[PoeClient] Static models fetched successfully', {
        models: staticModels,
      });

      return staticModels;
    } catch (error: any) {
      this.logger.error('[PoeClient] Error using static models', {
        error: error.message,
      });
      throw new Error('Failed to fetch static models');
    }
  }
}
