import { Controller, Post, UploadedFiles, UseInterceptors, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserJwt } from '../../../shared/user-jwt.interface';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles.guard';
import { Roles } from '../roles.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../services/storage.service';

@Controller('assets')
export class AssetsController {
  constructor(
    private readonly storageService: StorageService,
    @InjectModel('Asset') private readonly assetModel: Model<any>,
    @InjectModel('Subscription') private readonly subscriptionModel: Model<any>,
  ) {}

  @Roles('tenant')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @UseInterceptors(FilesInterceptor('files'))
  @Post('upload')
  async uploadAssets(@UploadedFiles() files: Express.Multer.File[], @Request() req: { user: UserJwt }) {
    const tenantId = req.user.tenantId;
    // Check subscription plan limits
    const sub = await this.subscriptionModel.findOne({ tenantId });
    const planLimits: Record<string, number> = { Pro: 50, Basic: 10, None: 0 };
    const limit = planLimits[sub?.plan || 'None'] || 0;
    const currentCount = await this.assetModel.countDocuments({ tenantId });
    if (currentCount + files.length > limit) {
      throw new BadRequestException('Asset upload limit exceeded for your plan.');
    }
    try {
      const uploaded = await this.storageService.uploadFiles(files);
      const assets = uploaded.map((file: any) => ({
        tenantId,
        url: file.url,
        filename: file.filename,
      }));
      await this.assetModel.insertMany(assets);
      return { success: true, assets };
    } catch (err) {
      throw new BadRequestException('Asset upload failed.');
    }
  }
}
