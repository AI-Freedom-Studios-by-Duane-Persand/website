// api/src/scheduling/social-publisher/meta-direct.publisher.ts
import { Injectable, Logger } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { SocialPublisher } from './social.publisher';
import { CreativeDocument } from '../../models/creative.schema';
import { SocialAccountsManagerService } from '../../social/social-accounts-manager.service';
import { MetaService } from '../../social/meta.service';

/**
 * Direct Meta publisher - uses stored Facebook/Instagram accounts
 * Bypasses Ayrshare entirely
 */
@Injectable()
export class MetaDirectPublisher implements SocialPublisher {
  private readonly logger = new Logger(MetaDirectPublisher.name);

  constructor(
    private readonly accountsManager: SocialAccountsManagerService,
    private readonly metaService: MetaService,
  ) {}

  async publishOrganicPost(args: {
    tenantId: ObjectId;
    creative: CreativeDocument;
    platforms: string[];
  }): Promise<{ platformIds: Record<string, string> }> {
    const { creative, platforms } = args;
    const platformIds: Record<string, string> = {};

    // Get user's connected accounts (assuming userId from creative or tenantId)
    const userId = creative.userId?.toString();
    const tenantId = args.tenantId.toString();

    if (!userId) {
      throw new Error('User ID not found on creative');
    }

    const accounts = await this.accountsManager.getUserAccounts(userId, tenantId);

    for (const platform of platforms) {
      try {
        if (platform === 'facebook') {
          const fbAccounts = accounts.filter(a => a.platform === 'facebook' && a.isActive);
          if (fbAccounts.length === 0) {
            this.logger.warn('No active Facebook accounts found');
            continue;
          }

          // Use first active Facebook account
          const account = fbAccounts[0];
          const accessToken = await this.accountsManager.getAccessToken(account._id.toString());

          // Build post content
          const content = creative.copy?.caption || '';
          const imageUrl = creative.visual?.imageUrl;

          // Post to Facebook Page
          const result = await this.metaService.postToFacebookPage(
            account.pageId!,
            accessToken,
            {
              message: content,
              link: imageUrl,
            },
          );

          platformIds['facebook'] = result.id;
          this.logger.log(`Posted to Facebook Page ${account.pageName}: ${result.id}`);
        } else if (platform === 'instagram') {
          const igAccounts = accounts.filter(a => a.platform === 'instagram' && a.isActive);
          if (igAccounts.length === 0) {
            this.logger.warn('No active Instagram accounts found');
            continue;
          }

          // Use first active Instagram account
          const account = igAccounts[0];
          const accessToken = await this.accountsManager.getAccessToken(account._id.toString());

          // Build post content
          const caption = creative.copy?.caption || '';
          const imageUrl = creative.visual?.imageUrl;
          const videoUrl = creative.assets?.videoUrl;

          if (!imageUrl && !videoUrl) {
            this.logger.warn('No media URL found for Instagram post');
            continue;
          }

          // Post to Instagram
          const result = await this.metaService.postToInstagram(
            account.instagramAccountId!,
            accessToken,
            {
              caption,
              image_url: imageUrl,
              video_url: videoUrl,
              media_type: videoUrl ? 'REELS' : 'IMAGE',
            },
          );

          platformIds['instagram'] = result.id;
          this.logger.log(`Posted to Instagram ${account.instagramUsername}: ${result.id}`);
        }
      } catch (error: any) {
        this.logger.error(`Failed to post to ${platform}`, error?.message);
        // Continue with other platforms
      }
    }

    return { platformIds };
  }
}
