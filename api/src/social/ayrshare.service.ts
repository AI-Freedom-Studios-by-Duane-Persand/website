import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AyrshareService {
  private readonly logger = new Logger(AyrshareService.name);
  private readonly apiUrl = 'https://app.ayrshare.com/api';
  private readonly apiKey = process.env.AYRSHARE_API_KEY;

  async createMetaPost(content: string, metaPageId: string): Promise<any> {
    try {
      this.logger.log('Sending request to Ayrshare for Meta post creation...');
      const response = await axios.post(
        `${this.apiUrl}/post`,
        {
          post: content,
          platforms: ['facebook'],
          meta: { pageId: metaPageId },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log('Meta post created successfully via Ayrshare');
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data as any;

        const msg =
          data?.message ||
          data?.error ||
          (typeof data === 'string' ? data : null) ||
          error.message ||
          'Unknown axios error';

        this.logger.error(`Failed to create Meta post (${status ?? 'no-status'}): ${msg}`);
      }
      throw error;
    }
  }

  // Method to fetch connected accounts
  async getConnectedAccounts() {
    // Placeholder: Replace with Ayrshare API call to fetch connected accounts
    return { message: 'Fetch connected accounts not implemented yet' };
  }

  // Method to connect a new account
  async connectAccount(platform: string, credentials: any) {
    // Placeholder: Replace with Ayrshare API call to connect an account
    return { message: `Connect account for platform ${platform} not implemented yet` };
  }

  // Method to disconnect an account
  async disconnectAccount(platform: string) {
    // Placeholder: Replace with Ayrshare API call to disconnect an account
    return { message: `Disconnect account for platform ${platform} not implemented yet` };
  }
}
