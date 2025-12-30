import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AyrshareService } from './ayrshare.service';
import { SocialAccountsController } from './social-accounts.controller';
import { SocialPublisher } from './social.publisher';
import { MetaService } from './meta.service';
import { MetaController } from './meta.controller';
import { SocialAccountSchema } from '../models/social-account.schema';
import { SocialAccountsManagerService } from './social-accounts-manager.service';
import { SocialAccountsManagerController } from './social-accounts-manager.controller';
import { EncryptionService } from '../common/encryption.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'SocialAccount', schema: SocialAccountSchema },
    ]),
  ],
  controllers: [
    SocialAccountsController,
    MetaController,
    SocialAccountsManagerController,
  ],
  providers: [
    AyrshareService,
    SocialPublisher,
    MetaService,
    SocialAccountsManagerService,
    EncryptionService,
  ],
  exports: [
    SocialPublisher,
    AyrshareService,
    MetaService,
    SocialAccountsManagerService,
    EncryptionService,
  ],
})
export class SocialAccountsModule {}
