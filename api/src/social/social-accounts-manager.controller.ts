import { Controller, Get, Post, Delete, Body, Query, Param, Req, UseGuards } from '@nestjs/common';
import { SocialAccountsManagerService } from './social-accounts-manager.service';
import { MetaService } from './meta.service';

/**
 * Controller for managing connected social accounts
 */
@Controller('social-accounts-manager')
export class SocialAccountsManagerController {
  constructor(
    private readonly accountsManager: SocialAccountsManagerService,
    private readonly metaService: MetaService,
  ) {}

  /**
   * Save connected accounts after OAuth flow
   */
  @Post('connect')
  async connectAccounts(
    @Body() body: {
      userId: string;
      tenantId: string;
      userAccessToken: string;
      metaUserId?: string;
      scopes: string[];
    },
    @Req() req: any,
  ) {
    const { userId, tenantId, userAccessToken, metaUserId, scopes } = body;

    // Get user's Pages
    const pages = await this.metaService.getUserPages(userAccessToken);

    const connectedAccounts = [];

    for (const page of pages) {
      // Save Facebook Page account
      const fbAccount = await this.accountsManager.upsertAccount({
        userId,
        tenantId,
        platform: 'facebook',
        metaUserId,
        pageId: page.id,
        pageName: page.name,
        accessToken: page.access_token,
        tokenType: 'page',
        scopes,
      });
      connectedAccounts.push(fbAccount);

      // Check for Instagram Business account
      try {
        const igAccount = await this.metaService.getInstagramAccount(page.id, page.access_token);
        
        if (igAccount) {
          const igAccountDoc = await this.accountsManager.upsertAccount({
            userId,
            tenantId,
            platform: 'instagram',
            metaUserId,
            pageId: page.id,
            pageName: page.name,
            instagramAccountId: igAccount.id,
            instagramUsername: igAccount.username,
            accessToken: page.access_token, // Instagram uses Page token
            tokenType: 'page',
            scopes,
          });
          connectedAccounts.push(igAccountDoc);
        }
      } catch (error) {
        console.error(`Failed to get Instagram for page ${page.id}:`, error);
      }
    }

    return {
      success: true,
      connectedAccounts: connectedAccounts.length,
      accounts: connectedAccounts.map(acc => ({
        id: acc._id,
        platform: acc.platform,
        name: acc.platform === 'facebook' ? acc.pageName : acc.instagramUsername,
      })),
    };
  }

  /**
   * Get all connected accounts for a user
   */
  @Get('accounts')
  async getAccounts(
    @Query('userId') userId: string,
    @Query('tenantId') tenantId: string,
  ) {
    const accounts = await this.accountsManager.getUserAccounts(userId, tenantId);
    
    return accounts.map(acc => ({
      id: acc._id,
      platform: acc.platform,
      name: acc.platform === 'facebook' ? acc.pageName : acc.instagramUsername,
      pageId: acc.pageId,
      instagramAccountId: acc.instagramAccountId,
      instagramUsername: acc.instagramUsername,
      isActive: acc.isActive,
      tokenExpiresAt: acc.tokenExpiresAt,
      lastUsedAt: acc.lastUsedAt,
      lastSyncedAt: acc.lastSyncedAt,
      errorCount: acc.errorCount,
      lastError: acc.lastError,
      createdAt: acc.createdAt,
    }));
  }

  /**
   * Get a specific account
   */
  @Get('accounts/:accountId')
  async getAccount(@Param('accountId') accountId: string) {
    const account = await this.accountsManager.getAccount(accountId);
    
    return {
      id: account._id,
      platform: account.platform,
      name: account.platform === 'facebook' ? account.pageName : account.instagramUsername,
      pageId: account.pageId,
      instagramAccountId: account.instagramAccountId,
      instagramUsername: account.instagramUsername,
      isActive: account.isActive,
      tokenExpiresAt: account.tokenExpiresAt,
      tokenType: account.tokenType,
      scopes: account.scopes,
      lastUsedAt: account.lastUsedAt,
      lastSyncedAt: account.lastSyncedAt,
      errorCount: account.errorCount,
      lastError: account.lastError,
      createdAt: account.createdAt,
    };
  }

  /**
   * Deactivate an account
   */
  @Post('accounts/:accountId/deactivate')
  async deactivateAccount(@Param('accountId') accountId: string) {
    await this.accountsManager.deactivateAccount(accountId);
    return { success: true };
  }

  /**
   * Delete an account
   */
  @Delete('accounts/:accountId')
  async deleteAccount(@Param('accountId') accountId: string) {
    await this.accountsManager.deleteAccount(accountId);
    return { success: true };
  }

  /**
   * Manually trigger token refresh for an account
   */
  @Post('accounts/:accountId/refresh-token')
  async refreshToken(@Param('accountId') accountId: string) {
    const account = await this.accountsManager.getAccount(accountId);
    // The getAccessToken method will automatically refresh if needed
    await this.accountsManager.getAccessToken(accountId);
    
    return {
      success: true,
      message: 'Token refreshed successfully',
    };
  }

  /**
   * Post to Facebook using saved account
   */
  @Post('post/facebook')
  async postToFacebook(
    @Body() body: {
      accountId: string;
      message?: string;
      link?: string;
      published?: boolean;
      scheduled_publish_time?: number | string;
    },
  ) {
    const { account, token } = await this.accountsManager.getAccountWithToken(body.accountId);
    
    if (account.platform !== 'facebook') {
      throw new Error('Account is not a Facebook page');
    }

    const result = await this.metaService.postToFacebookPage(
      account.pageId!,
      token,
      {
        message: body.message,
        link: body.link,
        published: body.published,
        scheduled_publish_time: body.scheduled_publish_time,
      },
    );

    return result;
  }

  /**
   * Post photo to Facebook using saved account
   */
  @Post('post/facebook/photo')
  async postPhotoToFacebook(
    @Body() body: {
      accountId: string;
      photoUrl: string;
      caption?: string;
    },
  ) {
    const { account, token } = await this.accountsManager.getAccountWithToken(body.accountId);
    
    if (account.platform !== 'facebook') {
      throw new Error('Account is not a Facebook page');
    }

    const result = await this.metaService.postPhotoToFacebookPage(
      account.pageId!,
      token,
      body.photoUrl,
      body.caption,
    );

    return result;
  }

  /**
   * Post to Instagram using saved account
   */
  @Post('post/instagram')
  async postToInstagram(
    @Body() body: {
      accountId: string;
      image_url?: string;
      video_url?: string;
      caption?: string;
      media_type?: 'IMAGE' | 'VIDEO' | 'REELS' | 'STORIES';
    },
  ) {
    const { account, token } = await this.accountsManager.getAccountWithToken(body.accountId);
    
    if (account.platform !== 'instagram') {
      throw new Error('Account is not an Instagram account');
    }

    const result = await this.metaService.postToInstagram(
      account.instagramAccountId!,
      token,
      {
        image_url: body.image_url,
        video_url: body.video_url,
        caption: body.caption,
        media_type: body.media_type,
      },
    );

    return result;
  }
}
