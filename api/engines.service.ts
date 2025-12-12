// Engine runner and logging
import { Injectable } from '@nestjs/common';
import { GeminiClient } from './gemini.client';

@Injectable()
export class EnginesService {
  private gemini = new GeminiClient();

  async runEngine(engine: string, input: any, tenantId: string) {
    let output;
    if (engine === 'strategy') {
      output = await this.gemini.run(input);
    } else if (engine === 'copy') {
      output = await this.gemini.run(input);
    } else {
      throw new Error('Unknown engine');
    }
    // Log engine run (stub)
    // TODO: Save to engineRuns collection
    return { engine, input, output, status: 'completed', tenantId };
  }
}
