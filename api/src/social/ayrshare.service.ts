import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface AyrsharePostOptions {
  post: string;
  platforms: string[];
  mediaUrls?: string[];
  videoUrls?: string[];
  scheduleDate?: string; // ISO 8601 format
  profileKeys?: string[]; // Specific profile keys to post to
  shortenLinks?: boolean;
  facebookOptions?: {
    pageId?: string;
    linkAttachment?: string;
  };
  instagramOptions?: {
    imageUrl?: string;
    mediaType?: 'PHOTO' | 'VIDEO' | 'CAROUSEL_ALBUM';
  };
  twitterOptions?: {
    threadTweets?: string[];
  };
  linkedInOptions?: {
    commentOnShare?: string;
  };
  youtubeOptions?: {
    title?: string;
    description?: string;
    visibility?: 'public' | 'private' | 'unlisted';
  };
  tiktokOptions?: {
    privacyLevel?: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY';
    videoUrl?: string;
  };
}

export interface AyrsharePostResponse {
  status: string;
  id: string;
  postIds?: Record<string, string>;
  errors?: any[];
  refId?: string;
}

export interface AyrshareProfile {
  profileKey: string;
  title: string;
  platforms: string[];
  activePlatforms?: string[];
}

@Injectable()
export class AyrshareService {
  private readonly logger = new Logger(AyrshareService.name);
  private readonly apiUrl = 'https://api.ayrshare.com/api';
  private readonly apiKey: string;
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.apiKey = process.env.AYRSHARE_API_KEY || '';
    
    if (!this.apiKey) {
      this.logger.warn('AYRSHARE_API_KEY not configured. Social posting will not work.');
    }

    this.axiosInstance = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Create a social media post across multiple platforms
   */
  async createPost(options: AyrsharePostOptions): Promise<AyrsharePostResponse> {
    try {
      this.logger.log(`Creating post for platforms: ${options.platforms.join(', ')}`);
      
      const payload: any = {
        post: options.post,
        platforms: options.platforms,
      };

      if (options.mediaUrls?.length) {
        payload.mediaUrls = options.mediaUrls;
      }

      if (options.videoUrls?.length) {
        payload.videoUrls = options.videoUrls;
      }

      if (options.scheduleDate) {
        payload.scheduleDate = options.scheduleDate;
      }

      if (options.profileKeys?.length) {
        payload.profileKeys = options.profileKeys;
      }

      if (options.shortenLinks !== undefined) {
        payload.shortenLinks = options.shortenLinks;
      }

      // Platform-specific options
      if (options.facebookOptions) {
        payload.facebookOptions = options.facebookOptions;
      }

      if (options.instagramOptions) {
        payload.instagramOptions = options.instagramOptions;
      }

      if (options.twitterOptions) {
        payload.twitterOptions = options.twitterOptions;
      }

      if (options.linkedInOptions) {
        payload.linkedInOptions = options.linkedInOptions;
      }

      if (options.youtubeOptions) {
        payload.youtubeOptions = options.youtubeOptions;
      }

      if (options.tiktokOptions) {
        payload.tiktokOptions = options.tiktokOptions;
      }

      const response = await this.axiosInstance.post('/post', payload);
      
      this.logger.log(`Post created successfully: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      this.handleError('Failed to create post', error);
    }
  }

  /**
   * Legacy method for Meta posts - now uses the unified createPost method
   */
  async createMetaPost(content: string, metaPageId: string): Promise<any> {
    return this.createPost({
      post: content,
      platforms: ['facebook'],
      facebookOptions: { pageId: metaPageId },
    });
  }

  /**
   * Get list of connected social media profiles
   */
  async getProfiles(): Promise<AyrshareProfile[]> {
    try {
      this.logger.log('Fetching connected profiles...');
      const response = await this.axiosInstance.get('/profiles');
      return response.data;
    } catch (error: any) {
      this.handleError('Failed to fetch profiles', error);
    }
  }

  /**
   * Get details of a specific profile
   */
  async getProfile(profileKey: string): Promise<AyrshareProfile> {
    try {
      this.logger.log(`Fetching profile: ${profileKey}`);
      const response = await this.axiosInstance.get(`/profiles/${profileKey}`);
      return response.data;
    } catch (error: any) {
      this.handleError(`Failed to fetch profile ${profileKey}`, error);
    }
  }

  /**
   * Delete a scheduled post
   */
  async deletePost(postId: string, bulk?: boolean): Promise<any> {
    try {
      this.logger.log(`Deleting post: ${postId}`);
      const response = await this.axiosInstance.delete('/post', {
        data: { id: postId, bulk },
      });
      return response.data;
    } catch (error: any) {
      this.handleError(`Failed to delete post ${postId}`, error);
    }
  }

  /**
   * Get post history
   */
  async getHistory(lastRecords?: number, lastDays?: number): Promise<any> {
    try {
      this.logger.log('Fetching post history...');
      const params: any = {};
      if (lastRecords) params.lastRecords = lastRecords;
      if (lastDays) params.lastDays = lastDays;

      const response = await this.axiosInstance.get('/history', { params });
      return response.data;
    } catch (error: any) {
      this.handleError('Failed to fetch history', error);
    }
  }

  /**
   * Get analytics for a specific post
   */
  async getPostAnalytics(postId: string, platforms?: string[]): Promise<any> {
    try {
      this.logger.log(`Fetching analytics for post: ${postId}`);
      const params: any = { id: postId };
      if (platforms && platforms.length > 0) {
        params.platforms = platforms.join(',');
      }

      const response = await this.axiosInstance.get('/analytics/post', { params });
      return response.data;
    } catch (error: any) {
      this.handleError(`Failed to fetch analytics for post ${postId}`, error);
    }
  }

  /**
   * Get account-level analytics
   */
  async getAccountAnalytics(platforms?: string[]): Promise<any> {
    try {
      this.logger.log('Fetching account analytics...');
      const params: any = {};
      if (platforms && platforms.length > 0) {
        params.platforms = platforms.join(',');
      }

      const response = await this.axiosInstance.get('/analytics/social', { params });
      return response.data;
    } catch (error: any) {
      this.handleError('Failed to fetch account analytics', error);
    }
  }

  /**
   * Generate JWT token for account connection flow
   * Uses Ayrshare's public connection URL endpoint
   */
  async generateJWT(domain?: string): Promise<{ jwt: string; url: string }> {
    try {
      this.logger.log('Generating connection URL for account linking...');
      
      // Use the public connection URL endpoint which doesn't require JWT generation
      // This returns a URL that users can visit to connect their social accounts
      const response = await this.axiosInstance.get('/profiles/url');
      
      // The response contains a URL for users to authorize their social accounts
      const url = response.data?.url || response.data?.authUrl;
      
      if (!url) {
        throw new Error('No connection URL returned from Ayrshare');
      }
      
      return { 
        jwt: '', // Not needed for this flow
        url 
      };
    } catch (error: any) {
      this.handleError('Failed to generate connection URL', error);
    }
  }

  /**
   * Generate JWT token for account connection flow (Business Plan)
   * Creates a new profile and generates JWT in one call for convenience
   * Per Ayrshare Business Plan docs: flow is create profile → POST /generateJWT with profile key
   */
  async generateJWTForNewProfile(): Promise<{ jwt: string; url: string; profileKey: string }> {
    try {
      this.logger.log('Creating new profile and generating JWT for account linking...');
      
      // Step 1: Create a new profile to get profile key
      const profileResponse = await this.axiosInstance.post('/create-profile', {
        title: `Profile ${Date.now()}`,
      });
      
      const profileKey = profileResponse.data?.profileKey;
      if (!profileKey) {
        throw new Error('No profile key returned from profile creation');
      }
      
      this.logger.log(`Profile created with key: ${profileKey}`);
      
      // Step 2: Generate JWT using the profile key
      const jwtResponse = await this.axiosInstance.post(
        '/generateJWT',
        {},
        {
          headers: {
            'Profile-Key': profileKey,
          },
        }
      );
      
      const jwt = jwtResponse.data?.jwt;
      if (!jwt) {
        throw new Error('No JWT returned from Ayrshare');
      }
      
      // Build authorization URL for frontend to open in new tab/window
      const url = `https://app.ayrshare.com/authorize?jwt=${jwt}`;
      
      this.logger.log('JWT generated successfully for account linking');
      return { jwt, url, profileKey };
    } catch (error: any) {
      this.handleError('Failed to create profile or generate JWT', error);
    }
  }

  /**
   * Generate JWT token for account connection flow using Business Plan profile key
   * Per Ayrshare Business Plan docs: POST /generateJWT requires profile key header
   * Returns JWT and authorization URL for user to link social accounts
   */
  async generateJWTWithProfileKey(profileKey: string): Promise<{ jwt: string; url: string }> {
    try {
      this.logger.log(`Generating JWT for account linking with profile key: ${profileKey}`);
      
      // POST /generateJWT with profile key in header
      // This returns a JWT and authorization URL for the user
      const response = await this.axiosInstance.post(
        '/generateJWT',
        {}, // Empty body, all data in headers
        {
          headers: {
            'Profile-Key': profileKey,
          },
        }
      );
      
      const jwt = response.data?.jwt;
      if (!jwt) {
        throw new Error('No JWT returned from Ayrshare');
      }
      
      // Build authorization URL for frontend to open in new tab/window
      const url = `https://app.ayrshare.com/authorize?jwt=${jwt}`;
      
      this.logger.log('JWT generated successfully for account linking');
      return { jwt, url };
    } catch (error: any) {
      this.handleError('Failed to generate JWT for account linking', error);
    }
  }

  /**
   * Create a new user profile for Business Plan multi-user setup
   */
  async createProfile(title?: string): Promise<{ profileKey: string }> {
    try {
      this.logger.log('Creating new user profile...');
      
      const response = await this.axiosInstance.post('/create-profile', {
        title: title || `Profile ${Date.now()}`,
      });
      
      const profileKey = response.data?.profileKey;
      if (!profileKey) {
        throw new Error('No profile key returned from profile creation');
      }
      
      this.logger.log(`Profile created with key: ${profileKey}`);
      return { profileKey };
    } catch (error: any) {
      this.handleError('Failed to create profile', error);
    }
  }

  /**
   * Upload media file to Ayrshare
   */
  async uploadMedia(file: { url?: string; fileName?: string }): Promise<{ url: string }> {
    try {
      this.logger.log('Uploading media to Ayrshare...');
      const response = await this.axiosInstance.post('/media/upload', file);
      return response.data;
    } catch (error: any) {
      this.handleError('Failed to upload media', error);
    }
  }

  /**
   * Get user account information
   */
  async getUser(): Promise<any> {
    try {
      this.logger.log('Fetching user information...');
      const response = await this.axiosInstance.get('/user');
      return response.data;
    } catch (error: any) {
      this.handleError('Failed to fetch user information', error);
    }
  }

  /**
   * Shorten a URL using Ayrshare
   */
  async shortenUrl(url: string): Promise<{ shortUrl: string }> {
    try {
      this.logger.log(`Shortening URL: ${url}`);
      const response = await this.axiosInstance.post('/url/shorten', { url });
      return response.data;
    } catch (error: any) {
      this.handleError('Failed to shorten URL', error);
    }
  }

  /**
   * Check if a platform connection is active
   */
  async checkConnection(platform: string): Promise<{ connected: boolean }> {
    try {
      this.logger.log(`Checking connection for platform: ${platform}`);
      const response = await this.axiosInstance.get(`/profiles/check/${platform}`);
      return response.data;
    } catch (error: any) {
      this.handleError(`Failed to check connection for ${platform}`, error);
    }
  }

  /**
   * Handle Ayrshare API errors
   */
  private handleError(message: string, error: any): never {
    const status = error.response?.status;
    const data = error.response?.data as any;
    const errorMsg =
      data?.message ||
      data?.error ||
      (typeof data === 'string' ? data : null) ||
      error.message ||
      'Unknown error';

    this.logger.error(`${message} (${status ?? 'no-status'}): ${errorMsg}`);
    throw new BadRequestException(`${message}: ${errorMsg}`);
  }
}
