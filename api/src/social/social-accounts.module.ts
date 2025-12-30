import { Module } from '@nestjs/common';
import { AyrshareService } from './ayrshare.service';
import { SocialAccountsController } from './social-accounts.controller';
import { SocialPublisher } from './social.publisher';
import { MetaService } from './meta.service';
import { MetaController } from './meta.controller';

@Module({
  controllers: [SocialAccountsController, MetaController],
  providers: [AyrshareService, SocialPublisher, MetaService],
  exports: [SocialPublisher, AyrshareService, MetaService],
})
export class SocialAccountsModule {}
