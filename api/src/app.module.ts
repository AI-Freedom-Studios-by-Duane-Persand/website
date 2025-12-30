import { Module, MiddlewareConsumer, NestModule, Logger, Injectable } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { Reflector } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { RequestLoggerMiddleware } from './common/request-logger.middleware';
import { MetricsModule } from './metrics/metrics.module';
import { CreativesModule } from './creatives/creatives.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { SchedulingWorker } from './jobs/scheduling.worker';
import { MetricsSyncWorker } from './jobs/metrics.worker';
import { VideoRenderWorker } from './jobs/videoRender.worker';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { BillingModule } from './billing/billing.module';
import { AdminModule } from './admin/admin.module';
import { SubscriptionsV2Module } from './subscriptions/subscriptionsV2.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { ModelsModule } from './models/models.module';
import { SocialAccountsModule } from './social/social-accounts.module';
import { MetaPostsModule } from './social/meta-posts.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { MetaAdsModule } from './meta-ads/meta-ads.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PlatformsController } from './platforms/platforms.controller';
import { EnginesModule } from './engines/engines.module';
import { CampaignChatModule } from './campaignChat.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { StrategiesModule } from './strategies/strategies.module';
import { PromptingModule } from './prompting/prompting.module';

const logger = new Logger('AppModule');

@Injectable()
export class AppModuleLogger {
  constructor() {
    Logger.log('AppModule initialized', 'AppModuleLogger');
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    WinstonModule.forRoot({
      transports: [
        new winston.transports.File({
          filename: './logs/api.log',
          level: 'debug',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
        new winston.transports.Console({
          level: 'info',
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/aifreedomstudios', {
      connectionFactory: (connection) => {
        connection.on('connected', () => {
          Logger.log(`MongoDB connected successfully`, 'AppModule');
        });
        connection.on('error', (err: Error) => {
          Logger.error(`MongoDB connection error: ${err.message}`, 'AppModule');
        });
        return connection;
      },
      // Atlas-specific options
      serverSelectionTimeoutMS: 10000, // 10 seconds to select a server
      socketTimeoutMS: 45000, // 45 seconds for socket operations
      retryWrites: true,
      retryReads: true,
      maxPoolSize: 10,
      minPoolSize: 2,
      // For development
      autoIndex: process.env.NODE_ENV === 'development',
      w: 1, // Write concern
    }),
    ModelsModule,
    ScheduleModule.forRoot(),
    MetricsModule,
    IntegrationsModule,
    CreativesModule,
    SchedulingModule,
    AuthModule,
    TenantsModule,
    BillingModule,
    AdminModule,
    SubscriptionsV2Module,
    SocialAccountsModule,
    MetaPostsModule,
    CampaignsModule,
    MetaAdsModule,
    SubscriptionsModule,
    EnginesModule,
    CampaignChatModule,
    ApprovalsModule,
    StrategiesModule,
    PromptingModule,
  ],
  controllers: [PlatformsController],
  providers: [AppModuleLogger],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}

