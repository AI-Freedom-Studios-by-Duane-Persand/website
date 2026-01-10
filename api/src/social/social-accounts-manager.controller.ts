import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SocialAccountsManagerService } from './social-accounts-manager.service';
import { MetaService } from './meta.service';
import { ConnectAccountsDto } from './dto/connect-accounts.dto';
import { GetAccountsDto } from './dto/get-accounts.dto';

/**
 * Controller for managing connected social accounts
 */
@Controller('social-accounts-manager')
export class SocialAccountsManagerController {
  private readonly logger = new Logger(SocialAccountsManagerController.name);

  constructor(
    private readonly accountsManager: SocialAccountsManagerService,
    private readonly metaService: MetaService,
  ) {}

  /**
   * Save connected accounts after OAuth flow
   */
  @Post('connect')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async connectAccounts(
    @Body() dto: ConnectAccountsDto,
    @Req() req: any,
  ) {
    const currentUserId = req?.user?.userId || req?.user?.id;
    const currentTenantId = req?.user?.tenantId;

    if (!currentUserId || currentUserId !== dto.userId) {
      throw new ForbiddenException('You are not allowed to connect accounts for this user');
    }
    if (!currentTenantId || currentTenantId !== dto.tenantId) {
      throw new ForbiddenException('Tenant mismatch for account connection');
    }

    const { userId, tenantId, userAccessToken, metaUserId, scopes } = dto;

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
      } catch (error: any) {
        const message = error instanceof Error ? error.stack || error.message : String(error);
        this.logger.error(`Failed to get Instagram for page ${page.id}: ${message}`);
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
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async getAccounts(
    @Query() dto: GetAccountsDto,
    @Req() req: any,
  ) {
    const currentUserId = req?.user?.userId || req?.user?.id;
    const currentTenantId = req?.user?.tenantId;

    if (!currentUserId || currentUserId !== dto.userId) {
      throw new ForbiddenException('You are not allowed to view these accounts');
    }
    if (!currentTenantId || currentTenantId !== dto.tenantId) {
      throw new ForbiddenException('Tenant mismatch for account access');
    }

    const accounts = await this.accountsManager.getUserAccounts(dto.userId, dto.tenantId);
    
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
  @UseGuards(AuthGuard('jwt'))
  async getAccount(@Param('accountId') accountId: string, @Req() req: any) {
    const account = await this.accountsManager.getAccount(accountId);
    const currentUserId = req?.user?.userId || req?.user?.id;

    if (!currentUserId || account.userId.toString() !== currentUserId) {
      throw new ForbiddenException('You are not allowed to view this account');
    }
    
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
  @Patch('accounts/:accountId/deactivate')
  @UseGuards(AuthGuard('jwt'))
  async deactivateAccount(@Param('accountId') accountId: string, @Req() req: any) {
    const currentUserId = req?.user?.userId || req?.user?.id;
    if (!currentUserId) {
      throw new UnauthorizedException();
    }

    const account = await this.accountsManager.getAccount(accountId);
    if (account.userId.toString() !== currentUserId) {
      throw new ForbiddenException('You are not allowed to deactivate this account');
    }

    await this.accountsManager.deactivateAccount(accountId, currentUserId);
    return { success: true };
  }

  /**
   * Delete an account
   */
  @Delete('accounts/:accountId')
  @UseGuards(AuthGuard('jwt'))
  async deleteAccount(@Param('accountId') accountId: string, @Req() req: any) {
    const currentUserId = req?.user?.userId || req?.user?.id;
    if (!currentUserId) {
      throw new UnauthorizedException();
    }

    const account = await this.accountsManager.getAccount(accountId);
    if (account.userId.toString() !== currentUserId) {
      throw new ForbiddenException('You are not allowed to delete this account');
    }

    await this.accountsManager.deleteAccount(accountId);
    return { success: true };
  }

  /**
   * Manually trigger token refresh for an account
   */
  @Post('accounts/:accountId/refresh-token')
  @UseGuards(AuthGuard('jwt'))
  async refreshToken(@Param('accountId') accountId: string, @Req() req: any) {
    const account = await this.accountsManager.getAccount(accountId);
    const currentUserId = req?.user?.userId || req?.user?.id;
    if (!currentUserId) {
      throw new UnauthorizedException();
    }
    if (account.userId.toString() !== currentUserId) {
      throw new ForbiddenException('You are not allowed to refresh this account token');
    }

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
  @UseGuards(AuthGuard('jwt'))
  async postToFacebook(
    @Body() body: {
      accountId: string;
      message?: string;
      link?: string;
      published?: boolean;
      scheduled_publish_time?: number | string;
    },
    @Req() req: any,
  ) {
    const { account, token } = await this.accountsManager.getAccountWithToken(body.accountId);
    const currentUserId = req?.user?.userId || req?.user?.id;
    if (!currentUserId) {
      throw new UnauthorizedException();
    }
    if (account.userId.toString() !== currentUserId) {
      throw new ForbiddenException('You are not allowed to post for this account');
    }
    
    if (account.platform !== 'facebook') {
      throw new BadRequestException('Account is not a Facebook page');
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
  @UseGuards(AuthGuard('jwt'))
  async postPhotoToFacebook(
    @Body() body: {
      accountId: string;
      photoUrl: string;
      caption?: string;
    },
    @Req() req: any,
  ) {
    const { account, token } = await this.accountsManager.getAccountWithToken(body.accountId);
    const currentUserId = req?.user?.userId || req?.user?.id;
    if (!currentUserId) {
      throw new UnauthorizedException();
    }
    if (account.userId.toString() !== currentUserId) {
      throw new ForbiddenException('You are not allowed to post for this account');
    }
    
    if (account.platform !== 'facebook') {
      throw new BadRequestException('Account is not a Facebook page');
    }

    if (!body.photoUrl || typeof body.photoUrl !== 'string' || !body.photoUrl.trim()) {
      throw new BadRequestException('photoUrl is required');
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
  @UseGuards(AuthGuard('jwt'))
  async postToInstagram(
    @Body() body: {
      accountId: string;
      image_url?: string;
      video_url?: string;
      caption?: string;
      media_type?: 'IMAGE' | 'VIDEO' | 'REELS' | 'STORIES';
    },
    @Req() req: any,
  ) {
    const { account, token } = await this.accountsManager.getAccountWithToken(body.accountId);
    const currentUserId = req?.user?.userId || req?.user?.id;
    if (!currentUserId) {
      throw new UnauthorizedException();
    }
    if (account.userId.toString() !== currentUserId) {
      throw new ForbiddenException('You are not allowed to post for this account');
    }
    
    if (account.platform !== 'instagram') {
      throw new BadRequestException('Account is not an Instagram account');
    }

    if (!body.media_type) {
      throw new BadRequestException('media_type is required');
    }

    const mediaType = body.media_type;
    const imageUrl = body.image_url?.trim();
    const videoUrl = body.video_url?.trim();

    if ((mediaType === 'IMAGE' || mediaType === 'STORIES') && !imageUrl) {
      throw new BadRequestException('image_url is required for IMAGE or STORIES media types');
    }

    if ((mediaType === 'VIDEO' || mediaType === 'REELS') && !videoUrl) {
      throw new BadRequestException('video_url is required for VIDEO or REELS media types');
    }

    if (!imageUrl && !videoUrl) {
      throw new BadRequestException('At least one of image_url or video_url is required');
    }

    const result = await this.metaService.postToInstagram(
      account.instagramAccountId!,
      token,
      {
        image_url: imageUrl,
        video_url: videoUrl,
        caption: body.caption,
        media_type: mediaType,
      },
    );

    return result;
  }
}
