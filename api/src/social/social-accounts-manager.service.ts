import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SocialAccountDocument } from '../models/social-account.schema';
import { EncryptionService } from '../common/encryption.service';
import { MetaService } from './meta.service';

export interface CreateSocialAccountDto {
  userId: string;
  tenantId: string;
  platform: 'facebook' | 'instagram';
  metaUserId?: string;
  pageId?: string;
  pageName?: string;
  instagramAccountId?: string;
  instagramUsername?: string;
  accessToken: string;
  tokenType: 'user' | 'page';
  tokenExpiresAt?: Date;
  scopes: string[];
}

/**
 * Social Accounts Manager Service
 * Handles CRUD operations, token encryption, and automatic token refresh
 */
@Injectable()
export class SocialAccountsManagerService {
  private readonly logger = new Logger(SocialAccountsManagerService.name);

  constructor(
    @InjectModel('SocialAccount') private socialAccountModel: Model<SocialAccountDocument>,
    private readonly encryptionService: EncryptionService,
    private readonly metaService: MetaService,
  ) {}

  /**
   * Create or update a social account
   */
  async upsertAccount(dto: CreateSocialAccountDto): Promise<SocialAccountDocument> {
    const encryptedToken = this.encryptionService.encrypt(dto.accessToken);

    // Find existing account
    const query: any = {
      userId: new Types.ObjectId(dto.userId),
      platform: dto.platform,
    };

    if (dto.platform === 'facebook' && dto.pageId) {
      query.pageId = dto.pageId;
    } else if (dto.platform === 'instagram' && dto.instagramAccountId) {
      query.instagramAccountId = dto.instagramAccountId;
    }

    const existing = await this.socialAccountModel.findOne(query);

    if (existing) {
      // Update existing account
      existing.encryptedAccessToken = encryptedToken;
      existing.tokenExpiresAt = dto.tokenExpiresAt;
      existing.tokenType = dto.tokenType;
      existing.scopes = dto.scopes;
      existing.pageName = dto.pageName || existing.pageName;
      existing.instagramUsername = dto.instagramUsername || existing.instagramUsername;
      existing.isActive = true;
      existing.lastSyncedAt = new Date();
      existing.errorCount = 0;
      existing.lastError = undefined;

      this.logger.log(`Updated ${dto.platform} account: ${dto.pageId || dto.instagramAccountId}`);
      return existing.save();
    }

    // Create new account
    const account = new this.socialAccountModel({
      userId: new Types.ObjectId(dto.userId),
      tenantId: new Types.ObjectId(dto.tenantId),
      platform: dto.platform,
      metaUserId: dto.metaUserId,
      pageId: dto.pageId,
      pageName: dto.pageName,
      instagramAccountId: dto.instagramAccountId,
      instagramUsername: dto.instagramUsername,
      encryptedAccessToken: encryptedToken,
      tokenType: dto.tokenType,
      tokenExpiresAt: dto.tokenExpiresAt,
      scopes: dto.scopes,
      isActive: true,
      lastSyncedAt: new Date(),
      errorCount: 0,
    });

    this.logger.log(`Created ${dto.platform} account: ${dto.pageId || dto.instagramAccountId}`);
    return account.save();
  }

  /**
   * Get all social accounts for a user
   */
  async getUserAccounts(userId: string, tenantId: string): Promise<SocialAccountDocument[]> {
    return this.socialAccountModel.find({
      userId: new Types.ObjectId(userId),
      tenantId: new Types.ObjectId(tenantId),
      isActive: true,
    }).sort({ createdAt: -1 });
  }

  /**
   * Get a specific social account
   */
  async getAccount(accountId: string): Promise<SocialAccountDocument> {
    const account = await this.socialAccountModel.findById(accountId);
    if (!account) {
      throw new NotFoundException('Social account not found');
    }
    return account;
  }

  /**
   * Get decrypted access token for an account
   */
  async getAccessToken(accountId: string): Promise<string> {
    const account = await this.getAccount(accountId);
    
    if (!account.isActive) {
      throw new Error('Social account is inactive');
    }

    // Check if token is expired
    if (account.tokenExpiresAt && account.tokenExpiresAt < new Date()) {
      // Try to refresh
      await this.refreshAccountToken(account);
      // Reload account
      const refreshedAccount = await this.getAccount(accountId);
      return this.encryptionService.decrypt(refreshedAccount.encryptedAccessToken);
    }

    // Update last used timestamp
    await this.socialAccountModel.updateOne(
      { _id: account._id },
      { $set: { lastUsedAt: new Date() } }
    );

    return this.encryptionService.decrypt(account.encryptedAccessToken);
  }

  /**
   * Get decrypted access token with account details
   */
  async getAccountWithToken(accountId: string): Promise<{ account: SocialAccountDocument; token: string }> {
    const token = await this.getAccessToken(accountId);
    const account = await this.getAccount(accountId);
    return { account, token };
  }

  /**
   * Deactivate a social account
   */
  async deactivateAccount(accountId: string): Promise<void> {
    await this.socialAccountModel.updateOne(
      { _id: new Types.ObjectId(accountId) },
      { $set: { isActive: false, updatedAt: new Date() } }
    );
    this.logger.log(`Deactivated account: ${accountId}`);
  }

  /**
   * Delete a social account
   */
  async deleteAccount(accountId: string): Promise<void> {
    await this.socialAccountModel.deleteOne({ _id: new Types.ObjectId(accountId) });
    this.logger.log(`Deleted account: ${accountId}`);
  }

  /**
   * Record an error for an account
   */
  async recordError(accountId: string, error: string): Promise<void> {
    const account = await this.getAccount(accountId);
    account.lastError = error;
    account.errorCount += 1;
    
    // Deactivate if too many errors
    if (account.errorCount >= 5) {
      account.isActive = false;
      this.logger.error(`Account ${accountId} deactivated after ${account.errorCount} errors`);
    }
    
    await account.save();
  }

  /**
   * Refresh a single account's token
   */
  private async refreshAccountToken(account: SocialAccountDocument): Promise<void> {
    try {
      this.logger.log(`Refreshing token for account ${account._id}...`);

      // For user tokens, exchange for long-lived token
      if (account.tokenType === 'user') {
        const currentToken = this.encryptionService.decrypt(account.encryptedAccessToken);
        
        // Get app credentials from env
        const appId = process.env.META_APP_ID;
        const appSecret = process.env.META_APP_SECRET;
        
        if (!appId || !appSecret) {
          throw new Error('Meta app credentials not configured');
        }

        const result = await this.metaService.getLongLivedToken(
          { appId, appSecret, redirectUri: '' },
          currentToken,
        );

        // Update with new token
        account.encryptedAccessToken = this.encryptionService.encrypt(result.access_token);
        account.tokenExpiresAt = new Date(Date.now() + (result.expires_in || 5184000) * 1000); // Default 60 days
        account.lastSyncedAt = new Date();
        account.errorCount = 0;
        account.lastError = undefined;
        
        await account.save();
        this.logger.log(`Successfully refreshed token for account ${account._id}`);
      } else {
        // Page tokens don't expire, just verify they still work
        const currentToken = this.encryptionService.decrypt(account.encryptedAccessToken);
        
        try {
          // Try to fetch page info to verify token
          const appAccessToken = `${process.env.META_APP_ID}|${process.env.META_APP_SECRET}`;
          await this.metaService.debugToken(currentToken, appAccessToken);
          
          account.lastSyncedAt = new Date();
          account.errorCount = 0;
          account.lastError = undefined;
          await account.save();
          
          this.logger.log(`Verified page token for account ${account._id}`);
        } catch (error: any) {
          this.logger.error(`Page token verification failed for account ${account._id}: ${error.message}`);
          await this.recordError(account._id.toString(), `Token verification failed: ${error.message}`);
        }
      }
    } catch (error: any) {
      this.logger.error(`Failed to refresh token for account ${account._id}: ${error.message}`);
      await this.recordError(account._id.toString(), `Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Cron job to refresh expiring tokens
   * Runs every 6 hours
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async refreshExpiringTokens(): Promise<void> {
    try {
      this.logger.log('Starting token refresh cron job...');

      // Find accounts with tokens expiring in the next 7 days
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      const expiringAccounts = await this.socialAccountModel.find({
        isActive: true,
        tokenType: 'user', // Only user tokens expire
        tokenExpiresAt: {
          $exists: true,
          $lte: sevenDaysFromNow,
        },
      });

      this.logger.log(`Found ${expiringAccounts.length} accounts with expiring tokens`);

      for (const account of expiringAccounts) {
        await this.refreshAccountToken(account);
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      this.logger.log('Token refresh cron job completed');
    } catch (error: any) {
      this.logger.error(`Token refresh cron job failed: ${error.message}`);
    }
  }

  /**
   * Verify all account tokens
   * Can be called manually or via cron
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async verifyAllTokens(): Promise<void> {
    try {
      this.logger.log('Starting token verification cron job...');

      const accounts = await this.socialAccountModel.find({ isActive: true });
      
      this.logger.log(`Verifying ${accounts.length} active accounts...`);

      for (const account of accounts) {
        try {
          const token = this.encryptionService.decrypt(account.encryptedAccessToken);
          const appAccessToken = `${process.env.META_APP_ID}|${process.env.META_APP_SECRET}`;
          
          const debugInfo = await this.metaService.debugToken(token, appAccessToken);
          
          if (debugInfo.is_valid) {
            account.lastSyncedAt = new Date();
            account.errorCount = 0;
            account.lastError = undefined;
            await account.save();
          } else {
            await this.recordError(account._id.toString(), 'Token is no longer valid');
          }
        } catch (error: any) {
          this.logger.error(`Token verification failed for account ${account._id}: ${error.message}`);
          await this.recordError(account._id.toString(), error.message);
        }

        // Delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      this.logger.log('Token verification cron job completed');
    } catch (error: any) {
      this.logger.error(`Token verification cron job failed: ${error.message}`);
    }
  }
}
