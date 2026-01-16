import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelsModule } from '../models/models.module';
import { SubscriptionsController } from './subscriptionsV2.controller';
import { Subscription, SubscriptionSchema } from '../models/subscriptionV2.model';
import { Package, PackageSchema } from '../models/package.model';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { TenantSchema } from '../tenants/schemas/tenant.schema';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';

@Module({
  imports: [
    ModelsModule,
    forwardRef(() => InfrastructureModule),
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
  ],
  controllers: [SubscriptionsController],
  providers: [
    SubscriptionsService,
    SubscriptionRepository,
    {
      provide: 'winston',
      useValue: WinstonModule.createLogger({
        transports: [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
          }),
        ],
      }),
    },
  ],
  exports: [SubscriptionsService],
})
export class SubscriptionsV2Module {}
