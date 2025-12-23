import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';

@Injectable()
export class MetaAdsService {
  private readonly logger = new Logger(MetaAdsService.name);
  private readonly apiUrl = 'https://graph.facebook.com/v16.0';
  private readonly accessToken = process.env.META_ADS_ACCESS_TOKEN;

  async createAdCampaign(campaignData: {
    name: string;
    objective: string;
    status: string;
    dailyBudget: number;
    accountId: string;
  }): Promise<any> {
    try {
      this.logger.log(`Creating campaign with data: ${JSON.stringify(campaignData)}`);
      const response = await axios.post(
        `${this.apiUrl}/act_${campaignData.accountId}/campaigns`,
        {
          name: campaignData.name,
          objective: campaignData.objective,
          status: campaignData.status,
          daily_budget: campaignData.dailyBudget,
          access_token: this.accessToken,
        },
      );

      this.logger.log(`Campaign created successfully: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const fbError = error.response?.data as any;
        const msg =
          fbError?.error?.message ||
          error.message ||
          'Unknown axios error';

        this.logger.error(`Failed to create campaign (${status ?? 'no-status'}): ${msg}`);
      }

      throw error;
    }
  }

  async getAdCampaigns(accountId: string): Promise<any> {
    try {
      if (!accountId) {
        throw new Error('Account ID is required to fetch campaigns.');
      }
      if (!this.accessToken) {
        throw new Error('Access token is missing. Please check your environment configuration.');
      }

      this.logger.log(`Fetching campaigns for account ID: ${accountId}`);
      const response = await axios.get(
        `${this.apiUrl}/act_${accountId}/campaigns`,
        { params: { access_token: this.accessToken } },
      );

      this.logger.log(`API Response: ${JSON.stringify(response.data)}`);
      this.logger.log(`Fetched ${response.data?.data?.length ?? 0} campaigns successfully`);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const fbError = error.response?.data as any;
        const msg =
          fbError?.error?.message ||
          error.message ||
          'Unknown axios error';

        this.logger.error(`Failed to fetch campaigns (${status ?? 'no-status'}): ${msg}`);
        this.logger.error(`Error details: ${JSON.stringify(fbError)}`);
      } else {
        this.logger.error(`Unexpected error: ${error}`);
      }

      throw error;
    }
  }

  async getAllCampaigns(accountId: string): Promise<any> {
    try {
      if (!accountId) {
        throw new Error('Account ID is required to fetch campaigns.');
      }

      const response = await axios.get(`${this.apiUrl}/act_${accountId}/campaigns`, {
        params: { access_token: this.accessToken },
      });

      if (!response.data || !Array.isArray(response.data.data)) {
        throw new Error('Invalid response format from Meta Ads API');
      }

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const fbError = error.response?.data as any;
        const msg =
          fbError?.error?.message ||
          error.message ||
          'Unknown axios error';

        if (msg.includes("Unsupported get request")) {
          throw new Error(
            `Meta Ads API error: The requested object ID 'act_${accountId}' does not exist or is inaccessible. Please check permissions or object availability.`
          );
        }

        console.error(
          `Meta Ads API error (${status ?? 'no-status'}): ${msg}`,
          fbError
        );

        throw new Error(`Failed to fetch all Meta Ads campaigns (${status ?? 'no-status'}): ${msg}`);
      }

      if (error instanceof Error) {
        console.error('Unexpected error:', error);
        throw new Error(`Failed to fetch all Meta Ads campaigns: ${error.message}`);
      }

      console.error('Unknown error occurred while fetching Meta Ads campaigns');
      throw new Error('Failed to fetch all Meta Ads campaigns: Unknown error');
    }
  }

  async publishCampaign(campaignId: string, accountId: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/act_${accountId}/adcampaigns/${campaignId}/publish`,
        {
          access_token: this.accessToken,
        },
      );

      console.log('Campaign published successfully:', response.data);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const fbError = error.response?.data as any;
        const msg =
          fbError?.error?.message ||
          error.message ||
          'Unknown axios error';

        console.error(`Failed to publish campaign (${status ?? 'no-status'}): ${msg}`);
        throw new Error(`Failed to publish campaign (${status ?? 'no-status'}): ${msg}`);
      }

      if (error instanceof Error) {
        console.error('Failed to publish campaign:', error.message);
        throw new Error(`Failed to publish campaign: ${error.message}`);
      }

      console.error('Failed to publish campaign: Unknown error');
      throw new Error('Failed to publish campaign: Unknown error');
    }
  }

  async postToMeta(content: string, accountId: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/act_${accountId}/feed`,
        {
          message: content,
          access_token: this.accessToken,
        },
      );

      console.log('Post to Meta successful:', response.data);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const fbError = error.response?.data as any;
        const msg =
          fbError?.error?.message ||
          error.message ||
          'Unknown axios error';

        console.error(`Failed to post to Meta (${status ?? 'no-status'}): ${msg}`);
        throw new Error(`Failed to post to Meta (${status ?? 'no-status'}): ${msg}`);
      }

      if (error instanceof Error) {
        console.error('Failed to post to Meta:', error.message);
        throw new Error(`Failed to post to Meta: ${error.message}`);
      }

      console.error('Failed to post to Meta: Unknown error');
      throw new Error('Failed to post to Meta: Unknown error');
    }
  }

  async updateAdCampaign(campaignId: string, updateData: {
    name?: string;
    status?: string;
    dailyBudget?: number;
  }): Promise<any> {
    try {
      this.logger.log(`Updating Meta Ads campaign with ID: ${campaignId}`);

      const response = await axios.post(
        `${this.apiUrl}/${campaignId}`,
        {
          ...updateData,
          access_token: this.accessToken,
        },
      );

      this.logger.log('Meta Ads campaign updated successfully');
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const fbError = error.response?.data as any;
        const msg =
          fbError?.error?.message ||
          error.message ||
          'Unknown axios error';

        this.logger.error(`Failed to update Meta Ads campaign (${status ?? 'no-status'}): ${msg}`);
      }
      throw error;
    }
  }

  async deleteAdCampaign(campaignId: string): Promise<any> {
    try {
      this.logger.log(`Deleting Meta Ads campaign with ID: ${campaignId}`);

      const response = await axios.delete(
        `${this.apiUrl}/${campaignId}`,
        {
          params: { access_token: this.accessToken },
        },
      );

      this.logger.log('Meta Ads campaign deleted successfully');
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const fbError = error.response?.data as any;
        const msg =
          fbError?.error?.message ||
          error.message ||
          'Unknown axios error';

        this.logger.error(`Failed to delete Meta Ads campaign (${status ?? 'no-status'}): ${msg}`);
      }
      throw error;
    }
  }

  public logMessage(level: 'log' | 'error', message: string): void {
    if (level === 'log') {
      this.logger.log(message);
    } else if (level === 'error') {
      this.logger.error(message);
    }
  }
}
