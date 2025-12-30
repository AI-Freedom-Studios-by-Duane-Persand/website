import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { AyrshareService } from './ayrshare.service';

@Controller('social-accounts')
export class SocialAccountsController {
  constructor(private readonly ayrshareService: AyrshareService) {}

  /**
   * Get all connected social media profiles
   */
  @Get('profiles')
  async getProfiles() {
    return this.ayrshareService.getProfiles();
  }

  /**
   * Get a specific profile by profile key
   */
  @Get('profiles/:profileKey')
  async getProfile(@Param('profileKey') profileKey: string) {
    return this.ayrshareService.getProfile(profileKey);
  }

  /**
   * Check if a platform connection is active
   */
  @Get('connection/:platform')
  async checkConnection(@Param('platform') platform: string) {
    return this.ayrshareService.checkConnection(platform);
  }

  /**
   * Generate JWT token for account connection flow
   */
  @Post('connect/jwt')
  async generateJWT(@Body() body: { domain?: string }) {
    return this.ayrshareService.generateJWT(body.domain);
  }

  /**
   * Generate JWT for new account connection (creates profile + JWT in one call)
   */
  @Post('connect/jwt-new')
  async generateJWTForNewProfile() {
    return this.ayrshareService.generateJWTForNewProfile();
  }

  /**
   * Create a new user profile for Business Plan multi-user setup
   */
  @Post('profiles/create')
  async createProfile(@Body() body: { title?: string }) {
    return this.ayrshareService.createProfile(body.title);
  }

  /**
   * Generate JWT token using an existing profile key
   */
  @Post('profiles/:profileKey/jwt')
  async generateJWTWithProfileKey(
    @Param('profileKey') profileKey: string,
  ) {
    return this.ayrshareService.generateJWTWithProfileKey(profileKey);
  }

  /**
   * Get user account information
   */
  @Get('user')
  async getUser() {
    return this.ayrshareService.getUser();
  }

  /**
   * Create a new social media post
   */
  @Post('posts')
  async createPost(@Body() options: any) {
    return this.ayrshareService.createPost(options);
  }

  /**
   * Delete a scheduled post
   */
  @Delete('posts/:postId')
  async deletePost(@Param('postId') postId: string, @Query('bulk') bulk?: boolean) {
    return this.ayrshareService.deletePost(postId, bulk);
  }

  /**
   * Get post history
   */
  @Get('history')
  async getHistory(
    @Query('lastRecords') lastRecords?: number,
    @Query('lastDays') lastDays?: number,
  ) {
    return this.ayrshareService.getHistory(lastRecords, lastDays);
  }

  /**
   * Get analytics for a specific post
   */
  @Get('analytics/post/:postId')
  async getPostAnalytics(
    @Param('postId') postId: string,
    @Query('platforms') platforms?: string,
  ) {
    const platformArray = platforms ? platforms.split(',') : undefined;
    return this.ayrshareService.getPostAnalytics(postId, platformArray);
  }

  /**
   * Get account-level analytics
   */
  @Get('analytics/account')
  async getAccountAnalytics(@Query('platforms') platforms?: string) {
    const platformArray = platforms ? platforms.split(',') : undefined;
    return this.ayrshareService.getAccountAnalytics(platformArray);
  }

  /**
   * Upload media file
   */
  @Post('media/upload')
  async uploadMedia(@Body() file: { url?: string; fileName?: string }) {
    return this.ayrshareService.uploadMedia(file);
  }

  /**
   * Shorten a URL
   */
  @Post('url/shorten')
  async shortenUrl(@Body() body: { url: string }) {
    return this.ayrshareService.shortenUrl(body.url);
  }
}
