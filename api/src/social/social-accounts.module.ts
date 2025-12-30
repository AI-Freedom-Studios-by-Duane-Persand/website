import { Module } from '@nestjs/common';
import { AyrshareService } from './ayrshare.service';
import { SocialAccountsController } from './social-accounts.controller';
import { SocialPublisher } from './social.publisher';

@Module({
  controllers: [SocialAccountsController],
  providers: [AyrshareService, SocialPublisher],
  exports: [SocialPublisher, AyrshareService],
})
export class SocialAccountsModule {}
