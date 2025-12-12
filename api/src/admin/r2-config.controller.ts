import { Controller, Get, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../roles.guard';
import { Roles } from '../roles.decorator';
import { ConfigService } from '../integrations/config.service';

@Controller('admin/r2-config')
export class R2ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @Roles('admin', 'superadmin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getR2Config() {
    try {
      return await this.configService.getConfig('global', 'r2');
    } catch (err) {
      throw new BadRequestException('R2 config not found');
    }
  }

  @Post()
  @Roles('admin', 'superadmin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async setR2Config(@Body() body: any) {
    try {
      await this.configService.setConfig('global', 'r2', body);
      return { success: true };
    } catch (err) {
      throw new BadRequestException('Failed to update R2 config');
    }
  }
}
