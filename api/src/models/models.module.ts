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
// Add other schemas as needed

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Subscription', schema: SubscriptionSchema },
      { name: 'Creative', schema: CreativeSchema },
      { name: Package.name, schema: PackageSchema },
      { name: 'Campaign', schema: CampaignSchema },
      { name: 'IntegrationConfig', schema: IntegrationConfigSchema },
      { name: 'Metric', schema: MetricSchema },
      // Add other models here
    ]),
  ],
  exports: [MongooseModule],
})
export class ModelsModule {}
