import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantSchema } from './tenant.schema';
import { UserSchema } from './user.schema';
import { SubscriptionSchema } from './subscriptionV2.model';
import { Package, PackageSchema } from './package.model';
import { CreativeSchema } from './creative.schema';
import { CampaignSchema } from './campaign.schema';
import { IntegrationConfigSchema } from './integrationConfig.schema';
import { MetricSchema } from './metric.schema';
import { EngineRunSchema } from './engineRun.model';
import { CampaignSessionSchema } from './campaignSession.schema';
import { CampaignMessageSchema } from './campaignMessage.schema';
import { ScheduledItemSchema } from './scheduledItem.schema';
import { BrandProfileSchema } from './brandProfile.schema';
import { AssetSchema } from './asset.model';
import { ExperimentSchema } from './experiment.schema';
import { AngleSchema } from './angle.schema';
import { BrandingConfigSchema } from '../admin/branding.model';
import { StrategySchema } from './strategy.model';
import { ApprovalSchema } from './approval.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Tenant', schema: TenantSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Subscription', schema: SubscriptionSchema },
      { name: 'Creative', schema: CreativeSchema },
      { name: Package.name, schema: PackageSchema },
      { name: 'Campaign', schema: CampaignSchema },
      { name: 'IntegrationConfig', schema: IntegrationConfigSchema },
      { name: 'Metric', schema: MetricSchema },
      { name: 'EngineRun', schema: EngineRunSchema },
      { name: 'CampaignSession', schema: CampaignSessionSchema },
      { name: 'CampaignMessage', schema: CampaignMessageSchema },
      { name: 'ScheduledItem', schema: ScheduledItemSchema },
      { name: 'BrandProfile', schema: BrandProfileSchema },
      { name: 'Asset', schema: AssetSchema },
      { name: 'Experiment', schema: ExperimentSchema },
      { name: 'Angle', schema: AngleSchema },
      { name: 'BrandingConfig', schema: BrandingConfigSchema },
      { name: 'Strategy', schema: StrategySchema },
      { name: 'Approval', schema: ApprovalSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class ModelsModule {}
