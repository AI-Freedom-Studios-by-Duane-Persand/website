
import { Body, Controller, Post, Get, UploadedFile, UseInterceptors, Req, BadRequestException, UseGuards, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { Request } from 'express';
import { SubscriptionRequired } from '../auth/subscription-required.decorator';
import { SubscriptionRequiredGuard } from '../auth/subscription-required.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @SubscriptionRequired('asset-upload')
  @UseGuards(SubscriptionRequiredGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) throw new BadRequestException('No file uploaded');

    // Enforce plan limits and security
    const user = (req as any).user; // Assume user injected by auth middleware
    if (!user) throw new BadRequestException('Unauthorized');

    // Example: Check subscription status
    if (user.subscriptionStatus !== 'active') {
      throw new BadRequestException('Subscription inactive. Please upgrade to upload assets.');
    }

    // Example: Enforce asset upload limit (pseudo-code, replace with real logic)
    // Assume user.plan.assetLimit and user.assetCount are available
    const assetLimit = user.plan?.assetLimit ?? 10; // Default limit
    const assetCount = user.assetCount ?? 0;
    if (assetCount >= assetLimit) {
      throw new BadRequestException('Asset upload limit reached for your plan.');
    }

    // Proceed with upload
    const url = await this.storageService.uploadFile(file.buffer, undefined, file.mimetype);
    // Optionally: increment assetCount in DB here
    return { url };
  }

  @Post('sign-url')
  async signUrl(@Body() body: { url: string; expiresInSeconds?: number; tenantId?: string }) {
    if (!body?.url) throw new BadRequestException('url is required');
    const expiresIn = body.expiresInSeconds ?? 3600;
    const viewUrl = await this.storageService.getViewUrlForExisting(body.url, body.tenantId, expiresIn);
    return { viewUrl, expiresIn }; // Return signed URL (or canonical fallback)
  }

  /**
   * Refresh a single asset URL
   */
  @Post('assets/refresh-url')
  @UseGuards(AuthGuard('jwt'))
  async refreshAssetUrl(
    @Req() req: any,
    @Query('url') url: string,
  ): Promise<{ url: string }> {
    if (!url) {
      throw new BadRequestException('url query parameter is required');
    }

    const user = req.user;
    const refreshedUrl = await this.storageService.refreshAssetUrl(url, user.tenantId);
    return { url: refreshedUrl };
  }

  /**
   * Get asset URL status and expiration info
   */
  @Get('assets/status')
  @UseGuards(AuthGuard('jwt'))
  async getAssetStatus(
    @Req() req: any,
    @Query('url') url: string,
  ): Promise<{
    url: string;
    isPermanent: boolean;
    lastRefreshed?: Date;
    expiresAt?: Date;
    needsRefresh: boolean;
  }> {
    if (!url) {
      throw new BadRequestException('url query parameter is required');
    }

    const user = req.user;
    const status = await this.storageService.getAssetStatus(url, user.tenantId);
    return status;
  }

  /**
   * Batch refresh all expiring asset URLs for a tenant
   */
  @Post('assets/refresh-batch')
  @UseGuards(AuthGuard('jwt'))
  async refreshAssetUrlsBatch(
    @Req() req: any,
    @Query('olderThanDays') olderThanDays?: string,
  ): Promise<{ refreshedCount: number }> {
    const user = req.user;
    
    let days = olderThanDays ? parseInt(olderThanDays, 10) : 6;
    if (Number.isNaN(days)) {
      days = 6;
    }
    days = Math.max(1, Math.min(365, days));
    
    const refreshedCount = await this.storageService.refreshAssetUrlsBatch(user.tenantId, days);
    return { refreshedCount };
  }

  /**
   * Migrate all existing assets to permanent URLs (public bucket)
   */
  @Post('assets/migrate-to-permanent')
  @UseGuards(AuthGuard('jwt'))
  async migrateAssetsToPermanentUrls(
    @Req() req: any,
  ): Promise<{ migratedCount: number; skippedCount: number }> {
    const user = req.user;
    const result = await this.storageService.migrateAssetsToPermanentUrls(user.tenantId);
    return result;
  }
}
