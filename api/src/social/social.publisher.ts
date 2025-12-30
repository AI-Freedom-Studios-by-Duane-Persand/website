import { Injectable, Logger } from '@nestjs/common';
import { AyrshareService, AyrsharePostOptions } from './ayrshare.service';

/**
 * Options for publishing content to social media platforms
 * Uses AyrsharePostOptions for type compatibility
 */
export type PublishOptions = AyrsharePostOptions;

@Injectable()
export class SocialPublisher {
  private readonly logger = new Logger(SocialPublisher.name);

  constructor(private readonly ayrshareService: AyrshareService) {}

  /**
   * Unified method to publish content to multiple platforms
   */
  async publish(options: PublishOptions): Promise<any> {
    try {
      this.logger.log(`Publishing content to platforms: ${options.platforms.join(', ')}`);
      const response = await this.ayrshareService.createPost(options);
      this.logger.log('Content published successfully');
      return response;
    } catch (error: any) {
      this.logger.error(`Error publishing content: ${error.message}`);
      throw error;
    }
  }

  /**
   * Publish to Facebook
   */
  async publishToFacebook(
    content: string,
    mediaUrls?: string[],
    options?: PublishOptions['facebookOptions'],
  ): Promise<any> {
    return this.publish({
      post: content,
      platforms: ['facebook'],
      mediaUrls,
      facebookOptions: options,
    });
  }

  /**
   * Publish to Instagram
   */
  async publishToInstagram(
    content: string,
    mediaUrls?: string[],
    options?: PublishOptions['instagramOptions'],
  ): Promise<any> {
    return this.publish({
      post: content,
      platforms: ['instagram'],
      mediaUrls,
      instagramOptions: options,
    });
  }

  /**
   * Publish to Twitter
   */
  async publishToTwitter(
    content: string,
    mediaUrls?: string[],
    options?: PublishOptions['twitterOptions'],
  ): Promise<any> {
    return this.publish({
      post: content,
      platforms: ['twitter'],
      mediaUrls,
      twitterOptions: options,
    });
  }

  /**
   * Publish to LinkedIn
   */
  async publishToLinkedIn(
    content: string,
    mediaUrls?: string[],
    options?: PublishOptions['linkedInOptions'],
  ): Promise<any> {
    return this.publish({
      post: content,
      platforms: ['linkedin'],
      mediaUrls,
      linkedInOptions: options,
    });
  }

  /**
   * Publish to YouTube
   */
  async publishToYouTube(
    videoUrl: string,
    title: string,
    options?: PublishOptions['youtubeOptions'],
  ): Promise<any> {
    return this.publish({
      post: title,
      platforms: ['youtube'],
      videoUrls: [videoUrl],
      youtubeOptions: options,
    });
  }

  /**
   * Publish to TikTok
   */
  async publishToTikTok(
    videoUrl: string,
    caption: string,
    options?: PublishOptions['tiktokOptions'],
  ): Promise<any> {
    return this.publish({
      post: caption,
      platforms: ['tiktok'],
      videoUrls: [videoUrl],
      tiktokOptions: options,
    });
  }

  /**
   * Legacy method for Meta posts - now uses Facebook method
   */
  async publishToMeta(content: string, metaPageId: string): Promise<any> {
    return this.publishToFacebook(content, undefined, { pageId: metaPageId });
  }

  /**
   * Schedule a post for later publication
   */
  async schedulePost(options: PublishOptions, scheduleDate: Date | string): Promise<any> {
    const isoDate = typeof scheduleDate === 'string' ? scheduleDate : scheduleDate.toISOString();
    return this.publish({ ...options, scheduleDate: isoDate });
  }

  /**
   * Get list of connected social media profiles
   */
  async getConnectedProfiles(): Promise<any> {
    return this.ayrshareService.getProfiles();
  }

  /**
   * Get post history
   */
  async getPostHistory(lastRecords?: number, lastDays?: number): Promise<any> {
    return this.ayrshareService.getHistory(lastRecords, lastDays);
  }

  /**
   * Get analytics for a specific post
   */
  async getPostAnalytics(postId: string, platforms?: string[]): Promise<any> {
    return this.ayrshareService.getPostAnalytics(postId, platforms);
  }

  /**
   * Get account-level analytics
   */
  async getAccountAnalytics(platforms?: string[]): Promise<any> {
    return this.ayrshareService.getAccountAnalytics(platforms);
  }

  /**
   * Delete a scheduled or published post
   */
  async deletePost(postId: string, bulk?: boolean): Promise<any> {
    return this.ayrshareService.deletePost(postId, bulk);
  }

  /**
   * Upload media file to Ayrshare
   */
  async uploadMedia(file: { url?: string; fileName?: string }): Promise<{ url: string }> {
    return this.ayrshareService.uploadMedia(file);
  }

  /**
   * Shorten a URL
   */
  async shortenUrl(url: string): Promise<{ shortUrl: string }> {
    return this.ayrshareService.shortenUrl(url);
  }
}
