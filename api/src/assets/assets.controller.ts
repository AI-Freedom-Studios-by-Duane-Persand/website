// Asset upload controller
import { Controller, Post, UploadedFile, UseInterceptors, Req, Body, BadRequestException } from '@nestjs/common';
import { UserJwt } from '../../../shared/user-jwt.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';
import { CreativeModel } from '../models/creative.schema';
import { BrandProfileModel } from '../models/brandProfile.schema';

@Controller('assets')
export class AssetsController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAsset(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: import('express').Request,
    @Body() body: any
  ): Promise<{ success: boolean; url: string; creative: any; brandProfile: any }> {
    // Enforce plan limits and security (production logic should be here)
    const tenantId: string = (req.user && 'tenantId' in req.user) ? (req.user as UserJwt).tenantId : body.tenantId;
    if (!tenantId) throw new BadRequestException('Missing tenantId');
    if (!file) throw new BadRequestException('No file uploaded');
    const bucket = process.env.R2_BUCKET ?? '';
    const key = `${tenantId}/${Date.now()}_${file.originalname}`;
    const url = await this.storageService.uploadFile(file.buffer, key, file.mimetype, tenantId);

    let updatedCreative = null;
    let updatedBrandProfile = null;
    if (body.creativeId) {
      updatedCreative = await CreativeModel.findByIdAndUpdate(
        body.creativeId,
        { $push: { 'assets.imageUrls': url } },
        { new: true }
      ).lean();
    }
    if (body.brandProfileId) {
      updatedBrandProfile = await BrandProfileModel.findByIdAndUpdate(
        body.brandProfileId,
        { $push: { 'brandAssets.logos': url } },
        { new: true }
      ).lean();
    }
    return {
      success: true,
      url,
      creative: updatedCreative,
      brandProfile: updatedBrandProfile,
    };
  }
}
