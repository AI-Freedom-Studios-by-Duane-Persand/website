import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
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
    MetaController,
    SocialAccountsManagerController,
  ],
  providers: [
    MetaService,
    SocialAccountsManagerService,
    EncryptionService,
  ],
  exports: [
    MetaService,
    SocialAccountsManagerService,
    EncryptionService,
  ],
})
export class SocialAccountsModule {}
