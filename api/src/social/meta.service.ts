import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface MetaOAuthConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

export interface MetaAccessToken {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface MetaPageInfo {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  tasks?: string[];
}

export interface InstagramAccountInfo {
  id: string;
  username?: string;
  name?: string;
}

export interface MetaPostOptions {
  message?: string;
  link?: string;
  published?: boolean;
  scheduled_publish_time?: number | string;
  targeting?: any;
}

export interface InstagramMediaOptions {
  image_url?: string;
  video_url?: string;
  caption?: string;
  media_type?: 'IMAGE' | 'VIDEO' | 'REELS' | 'STORIES' | 'CAROUSEL_ALBUM';
  is_carousel_item?: boolean;
  children?: string; // Comma-separated container IDs for carousel
}

/**
 * Meta (Facebook/Instagram) Platform API Service
 * Handles OAuth, posting, and account management for Facebook Pages and Instagram Business accounts
 */
@Injectable()
export class MetaService {
  private readonly logger = new Logger(MetaService.name);
  private readonly graphApiClient: AxiosInstance;
  private readonly apiVersion = 'v24.0';

  constructor() {
    this.graphApiClient = axios.create({
      baseURL: `https://graph.facebook.com/${this.apiVersion}`,
      timeout: 30000,
    });
  }

  /**
   * Generate OAuth authorization URL for Facebook Login
   * @param config OAuth configuration
   * @param state CSRF protection state parameter
   * @param scope Comma-separated permissions (e.g., 'pages_manage_posts,instagram_content_publish')
   */
  generateAuthUrl(config: MetaOAuthConfig, state: string, scope: string): string {
    const params = new URLSearchParams({
      client_id: config.appId,
      redirect_uri: config.redirectUri,
      state,
      scope,
      response_type: 'code',
    });

    return `https://www.facebook.com/${this.apiVersion}/dialog/oauth?${params.toString()}`;
  }

  /**
   * Exchange OAuth code for access token
   * @param config OAuth configuration
   * @param code Authorization code from OAuth callback
   */
  async exchangeCodeForToken(config: MetaOAuthConfig, code: string): Promise<MetaAccessToken> {
    try {
      this.logger.log('Exchanging OAuth code for access token...');

      const response = await this.graphApiClient.get('/oauth/access_token', {
        params: {
          client_id: config.appId,
          client_secret: config.appSecret,
          redirect_uri: config.redirectUri,
          code,
        },
      });

      this.logger.log('Successfully obtained access token');
      return response.data;
    } catch (error: any) {
      this.handleError('Failed to exchange code for token', error);
    }
  }

  /**
   * Get long-lived user access token (60 days)
   * @param config OAuth configuration
   * @param shortLivedToken Short-lived access token
   */
  async getLongLivedToken(config: MetaOAuthConfig, shortLivedToken: string): Promise<MetaAccessToken> {
    try {
      this.logger.log('Exchanging short-lived token for long-lived token...');

      const response = await this.graphApiClient.get('/oauth/access_token', {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: config.appId,
          client_secret: config.appSecret,
          fb_exchange_token: shortLivedToken,
        },
      });

      this.logger.log('Successfully obtained long-lived token');
      return response.data;
    } catch (error: any) {
      this.handleError('Failed to get long-lived token', error);
    }
  }

  /**
   * Get user's Facebook Pages
   * @param userAccessToken User access token with pages_show_list permission
   */
  async getUserPages(userAccessToken: string): Promise<MetaPageInfo[]> {
    try {
      this.logger.log('Fetching user Pages...');

      const response = await this.graphApiClient.get('/me/accounts', {
        params: {
          access_token: userAccessToken,
          fields: 'id,name,access_token,category,tasks',
        },
      });

      this.logger.log(`Found ${response.data?.data?.length || 0} Pages`);
      return response.data?.data || [];
    } catch (error: any) {
      this.handleError('Failed to fetch user Pages', error);
    }
  }

  /**
   * Get Instagram Business account linked to a Facebook Page
   * @param pageId Facebook Page ID
   * @param pageAccessToken Page access token
   */
  async getInstagramAccount(pageId: string, pageAccessToken: string): Promise<InstagramAccountInfo | null> {
    try {
      this.logger.log(`Fetching Instagram account for Page ${pageId}...`);

      const response = await this.graphApiClient.get(`/${pageId}`, {
        params: {
          access_token: pageAccessToken,
          fields: 'instagram_business_account{id,username,name}',
        },
      });

      const igAccount = response.data?.instagram_business_account;
      if (!igAccount) {
        this.logger.warn(`No Instagram Business account linked to Page ${pageId}`);
        return null;
      }

      this.logger.log(`Found Instagram account: @${igAccount.username}`);
      return igAccount;
    } catch (error: any) {
      this.handleError('Failed to fetch Instagram account', error);
    }
  }

  /**
   * Post to Facebook Page
   * @param pageId Facebook Page ID
   * @param pageAccessToken Page access token
   * @param options Post options (message, link, scheduling, etc.)
   */
  async postToFacebookPage(pageId: string, pageAccessToken: string, options: MetaPostOptions): Promise<{ id: string }> {
    try {
      this.logger.log(`Creating post on Facebook Page ${pageId}...`);

      const response = await this.graphApiClient.post(
        `/${pageId}/feed`,
        {
          ...options,
          access_token: pageAccessToken,
        },
      );

      this.logger.log(`Successfully created Facebook post: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      this.handleError('Failed to post to Facebook Page', error);
    }
  }

  /**
   * Post photo to Facebook Page
   * @param pageId Facebook Page ID
   * @param pageAccessToken Page access token
   * @param photoUrl URL of the photo
   * @param caption Optional caption
   */
  async postPhotoToFacebookPage(
    pageId: string,
    pageAccessToken: string,
    photoUrl: string,
    caption?: string,
  ): Promise<{ id: string; post_id: string }> {
    try {
      this.logger.log(`Posting photo to Facebook Page ${pageId}...`);

      const response = await this.graphApiClient.post(
        `/${pageId}/photos`,
        {
          url: photoUrl,
          caption,
          access_token: pageAccessToken,
        },
      );

      this.logger.log(`Successfully posted photo: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      this.handleError('Failed to post photo to Facebook Page', error);
    }
  }

  /**
   * Create Instagram media container (Step 1 of publishing)
   * @param instagramAccountId Instagram Business account ID
   * @param pageAccessToken Page access token
   * @param options Media options (image_url, video_url, caption, etc.)
   */
  async createInstagramMediaContainer(
    instagramAccountId: string,
    pageAccessToken: string,
    options: InstagramMediaOptions,
  ): Promise<{ id: string }> {
    try {
      this.logger.log(`Creating Instagram media container for account ${instagramAccountId}...`);

      const response = await this.graphApiClient.post(
        `/${instagramAccountId}/media`,
        {
          ...options,
          access_token: pageAccessToken,
        },
      );

      this.logger.log(`Successfully created media container: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      this.handleError('Failed to create Instagram media container', error);
    }
  }

  /**
   * Publish Instagram media container (Step 2 of publishing)
   * @param instagramAccountId Instagram Business account ID
   * @param pageAccessToken Page access token
   * @param creationId Container ID from createInstagramMediaContainer
   */
  async publishInstagramMedia(
    instagramAccountId: string,
    pageAccessToken: string,
    creationId: string,
  ): Promise<{ id: string }> {
    try {
      this.logger.log(`Publishing Instagram media container ${creationId}...`);

      const response = await this.graphApiClient.post(
        `/${instagramAccountId}/media_publish`,
        {
          creation_id: creationId,
          access_token: pageAccessToken,
        },
      );

      this.logger.log(`Successfully published Instagram media: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      this.handleError('Failed to publish Instagram media', error);
    }
  }

  /**
   * Check Instagram media container status
   * @param containerId Media container ID
   * @param pageAccessToken Page access token
   */
  async checkInstagramContainerStatus(
    containerId: string,
    pageAccessToken: string,
  ): Promise<{ status_code: string }> {
    try {
      const response = await this.graphApiClient.get(`/${containerId}`, {
        params: {
          fields: 'status_code',
          access_token: pageAccessToken,
        },
      });

      return response.data;
    } catch (error: any) {
      this.handleError('Failed to check Instagram container status', error);
    }
  }

  /**
   * Post to Instagram (photos, videos, or reels) - combines container creation and publishing
   * @param instagramAccountId Instagram Business account ID
   * @param pageAccessToken Page access token
   * @param options Media options
   */
  async postToInstagram(
    instagramAccountId: string,
    pageAccessToken: string,
    options: InstagramMediaOptions,
  ): Promise<{ id: string; containerId: string }> {
    try {
      this.logger.log(`Posting to Instagram account ${instagramAccountId}...`);

      // Step 1: Create media container
      const container = await this.createInstagramMediaContainer(
        instagramAccountId,
        pageAccessToken,
        options,
      );

      // Step 2: Wait a moment for processing (especially for videos)
      if (options.video_url || options.media_type === 'VIDEO' || options.media_type === 'REELS') {
        this.logger.log('Video detected, waiting for processing...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check status
        const status = await this.checkInstagramContainerStatus(container.id, pageAccessToken);
        if (status.status_code === 'ERROR') {
          throw new Error('Media container processing failed');
        }
        if (status.status_code === 'IN_PROGRESS') {
          this.logger.warn('Media still processing, publish may fail. Retry in a moment.');
        }
      }

      // Step 3: Publish the media
      const published = await this.publishInstagramMedia(
        instagramAccountId,
        pageAccessToken,
        container.id,
      );

      this.logger.log(`Successfully posted to Instagram: ${published.id}`);
      return {
        id: published.id,
        containerId: container.id,
      };
    } catch (error: any) {
      this.handleError('Failed to post to Instagram', error);
    }
  }

  /**
   * Debug access token - check token validity and permissions
   * @param inputToken Token to inspect
   * @param appAccessToken App access token (app_id|app_secret) or admin token
   */
  async debugToken(inputToken: string, appAccessToken: string): Promise<any> {
    try {
      const response = await this.graphApiClient.get('/debug_token', {
        params: {
          input_token: inputToken,
          access_token: appAccessToken,
        },
      });

      return response.data?.data;
    } catch (error: any) {
      this.handleError('Failed to debug token', error);
    }
  }

  /**
   * Handle Meta API errors
   */
  private handleError(message: string, error: any): never {
    const status = error.response?.status;
    const data = error.response?.data as any;

    const errorMsg =
      data?.error?.message ||
      data?.message ||
      (typeof data === 'string' ? data : null) ||
      error.message ||
      'Unknown error';

    const errorCode = data?.error?.code;
    const errorType = data?.error?.type;

    this.logger.error(`${message} (${status ?? 'no-status'}): ${errorMsg}`, {
      code: errorCode,
      type: errorType,
    });

    throw new BadRequestException(`${message}: ${errorMsg}`);
  }
}
