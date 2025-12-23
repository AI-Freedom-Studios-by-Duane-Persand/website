import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { AyrshareService } from './ayrshare.service';

@Controller('social-accounts')
export class SocialAccountsController {
  constructor(private readonly ayrshareService: AyrshareService) {}

  @Get()
  async getConnectedAccounts() {
    // Placeholder: Replace with actual Ayrshare API call to fetch connected accounts
    return this.ayrshareService.getConnectedAccounts();
  }

  @Post()
  async connectAccount(@Body() body: { platform: string; credentials: any }) {
    const { platform, credentials } = body;
    // Placeholder: Replace with actual Ayrshare API call to connect an account
    return this.ayrshareService.connectAccount(platform, credentials);
  }

  @Delete(':platform')
  async disconnectAccount(@Param('platform') platform: string) {
    // Placeholder: Replace with actual Ayrshare API call to disconnect an account
    return this.ayrshareService.disconnectAccount(platform);
  }
}