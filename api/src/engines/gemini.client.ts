// api/src/engines/gemini.client.ts
// Stub GeminiClient for AI calls (to be implemented with real API)
import { Injectable } from '@nestjs/common';

@Injectable()
export class GeminiClient {
  async generateContent(task: string, input: any): Promise<any> {
    // Input validation
    if (!task || typeof task !== 'string') {
      throw new Error('Invalid task type for GeminiClient');
    }
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid input for GeminiClient');
    }
    try {
      // Use real Gemini API endpoint and key from env
      const apiKey = process.env.GEMINI_API_KEY;
      const endpoint = process.env.GEMINI_API_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
      if (!apiKey) throw new Error('Gemini API key missing');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: JSON.stringify({ task, input }) },
              ],
            },
          ],
        }),
      });
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (err: any) {
      // Security: Do not leak sensitive error details
      throw new Error('Failed to generate content with Gemini API');
    }
  }
}
