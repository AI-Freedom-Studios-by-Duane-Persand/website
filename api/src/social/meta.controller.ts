import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { MetaService, MetaPostOptions, InstagramMediaOptions } from './meta.service';

@Controller('meta')
export class MetaController {
  constructor(private readonly metaService: MetaService) {}

  /**
   * Generate OAuth authorization URL
   * Frontend redirects user to this URL to start OAuth flow
   */
  @Post('auth/url')
  generateAuthUrl(@Body() body: { appId: string; appSecret: string; redirectUri: string; state: string; scope?: string }) {
    const scope = body.scope || 'pages_manage_posts,pages_manage_engagement,pages_read_engagement,instagram_basic,instagram_content_publish';
    
    const url = this.metaService.generateAuthUrl(
      {
        appId: body.appId,
        appSecret: body.appSecret,
        redirectUri: body.redirectUri,
      },
      body.state,
      scope,
    );

    return { url };
  }

  /**
   * Exchange OAuth code for access token
   * Called from OAuth callback handler
   */
  @Post('auth/token')
  async exchangeToken(@Body() body: { appId: string; appSecret: string; redirectUri: string; code: string }) {
    return this.metaService.exchangeCodeForToken(
      {
        appId: body.appId,
        appSecret: body.appSecret,
        redirectUri: body.redirectUri,
      },
      body.code,
    );
  }

  /**
   * Get long-lived access token (60 days)
   */
  @Post('auth/long-lived-token')
  async getLongLivedToken(@Body() body: { appId: string; appSecret: string; shortLivedToken: string }) {
    return this.metaService.getLongLivedToken(
      {
        appId: body.appId,
        appSecret: body.appSecret,
        redirectUri: '', // Not needed for token exchange
      },
      body.shortLivedToken,
    );
  }

  /**
   * Get user's Facebook Pages
   */
  @Get('pages')
  async getUserPages(@Query('accessToken') accessToken: string) {
    return this.metaService.getUserPages(accessToken);
  }

  /**
   * Get Instagram Business account for a Page
   */
  @Get('pages/:pageId/instagram')
  async getInstagramAccount(
    @Param('pageId') pageId: string,
    @Query('accessToken') accessToken: string,
  ) {
    return this.metaService.getInstagramAccount(pageId, accessToken);
  }

  /**
   * Post to Facebook Page
   */
  @Post('facebook/post')
  async postToFacebook(
    @Body() body: { pageId: string; accessToken: string; options: MetaPostOptions },
  ) {
    return this.metaService.postToFacebookPage(body.pageId, body.accessToken, body.options);
  }

  /**
   * Post photo to Facebook Page
   */
  @Post('facebook/photo')
  async postPhotoToFacebook(
    @Body() body: { pageId: string; accessToken: string; photoUrl: string; caption?: string },
  ) {
    return this.metaService.postPhotoToFacebookPage(
      body.pageId,
      body.accessToken,
      body.photoUrl,
      body.caption,
    );
  }

  /**
   * Post to Instagram (photos, videos, reels)
   */
  @Post('instagram/post')
  async postToInstagram(
    @Body() body: { instagramAccountId: string; accessToken: string; options: InstagramMediaOptions },
  ) {
    return this.metaService.postToInstagram(
      body.instagramAccountId,
      body.accessToken,
      body.options,
    );
  }

  /**
   * Create Instagram media container (Step 1)
   */
  @Post('instagram/container')
  async createInstagramContainer(
    @Body() body: { instagramAccountId: string; accessToken: string; options: InstagramMediaOptions },
  ) {
    return this.metaService.createInstagramMediaContainer(
      body.instagramAccountId,
      body.accessToken,
      body.options,
    );
  }

  /**
   * Publish Instagram media container (Step 2)
   */
  @Post('instagram/publish')
  async publishInstagramMedia(
    @Body() body: { instagramAccountId: string; accessToken: string; creationId: string },
  ) {
    return this.metaService.publishInstagramMedia(
      body.instagramAccountId,
      body.accessToken,
      body.creationId,
    );
  }

  /**
   * Check Instagram container status
   */
  @Get('instagram/container/:containerId/status')
  async checkContainerStatus(
    @Param('containerId') containerId: string,
    @Query('accessToken') accessToken: string,
  ) {
    return this.metaService.checkInstagramContainerStatus(containerId, accessToken);
  }

  /**
   * Debug access token
   */
  @Post('auth/debug')
  async debugToken(@Body() body: { inputToken: string; appAccessToken: string }) {
    return this.metaService.debugToken(body.inputToken, body.appAccessToken);
  }
}
