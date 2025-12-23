import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelsModule } from '../models/models.module';
import { SubscriptionsController } from './subscriptionsV2.controller';
import { Subscription, SubscriptionSchema } from '../models/subscriptionV2.model';
import { Package, PackageSchema } from '../models/package.model';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { TenantSchema } from '../tenants/schemas/tenant.schema';

@Module({
  imports: [
    ModelsModule,
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
})
export class SubscriptionsV2Module {}
