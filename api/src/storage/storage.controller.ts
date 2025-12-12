
import { Controller, Post, UploadedFile, UseInterceptors, Req, BadRequestException, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { Request } from 'express';
import { SubscriptionRequired } from '../auth/subscription-required.decorator';
import { SubscriptionRequiredGuard } from '../auth/subscription-required.guard';

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
}
