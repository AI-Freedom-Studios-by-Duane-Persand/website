import { Controller, Post, Get, UseInterceptors, UploadedFiles, Req, BadRequestException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../roles.guard';
import { Roles } from '../roles.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { StorageService } from '../storage/storage.service';
import { BrandingService } from './branding.service';

@Controller('admin/branding')
export class BrandingController {
  constructor(
    private readonly storageService: StorageService,
    private readonly brandingService: BrandingService,
  ) {}

  @Post('upload')
  @Roles('admin', 'superadmin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FilesInterceptor('files', 2))
  async uploadBranding(@UploadedFiles() files: Express.Multer.File[], @Req() req: Request) {
    let logoUrl = '';
    let faviconUrl = '';
    for (const file of files) {
      if (['image/svg+xml', 'image/png'].includes(file.mimetype)) {
        // Logo
        if (file.size > 1024 * 1024) throw new BadRequestException('Logo file too large');
        logoUrl = await this.storageService.uploadFile(file.buffer, 'branding/logo', file.mimetype);
        await this.brandingService.updateLogo(logoUrl);
      } else if (['image/x-icon', 'image/png', 'image/svg+xml'].includes(file.mimetype)) {
        // Favicon
        if (file.size > 256 * 1024) throw new BadRequestException('Favicon file too large');
        faviconUrl = await this.storageService.uploadFile(file.buffer, 'branding/favicon', file.mimetype);
        await this.brandingService.updateFavicon(faviconUrl);
      } else {
        throw new BadRequestException('Invalid file type');
      }
    }
    return { logoUrl, faviconUrl };
  }

  @Get('config')
  async getBrandingConfig() {
    return await this.brandingService.getConfig();
  }
}
