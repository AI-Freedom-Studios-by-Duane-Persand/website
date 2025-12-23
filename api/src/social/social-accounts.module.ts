import { Module } from '@nestjs/common';
import { AyrshareService } from './ayrshare.service';
import { SocialAccountsController } from './social-accounts.controller';

@Module({
  controllers: [SocialAccountsController],
  providers: [AyrshareService],
})
export class SocialAccountsModule {}