// api/src/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BrandingConfigSchema } from './branding.model';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { ConfigService } from '../integrations/config.service';
import { TenantsModule } from '../tenants/tenants.module';
import { BrandingController } from './branding.controller';
import { BrandingService } from './branding.service';
import { StorageModule } from '../storage/storage.module';
import { LoggerModule } from '../logger.module';
import { UserSchema } from '../users/schemas/user.schema';
import { CampaignSchema } from '../models/campaign.schema';
import { CreativeSchema } from '../creatives/schemas/creative.schema';
import { Subscription, SubscriptionSchema } from '../models/subscriptionV2.model';
import { TenantSchema } from '../tenants/schemas/tenant.schema';
import { EngineRunSchema } from '../models/engineRun.schema';
import { IntegrationConfigSchema } from '../models/integrationConfig.schema';
import { AdminPackagesModule } from './admin-packages.module';
import { AdminPackagesController } from './admin-packages.controller';
import { R2ConfigController } from './r2-config.controller';
import { AdminStorageController } from './storage.controller';

import { ModelsModule } from '../models/models.module';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AdminModuleLogger {
  constructor() {
    Logger.log('AdminModule initialized', 'AdminModuleLogger');
  }
}

@Module({
  imports: [
    TenantsModule,
    StorageModule,
    LoggerModule,
    AdminPackagesModule,
    ModelsModule,
  ],
  providers: [AdminService, ConfigService, BrandingService, AdminModuleLogger],
  controllers: [AdminController, BrandingController, AdminPackagesController, R2ConfigController, AdminStorageController],
})
export class AdminModule {}
