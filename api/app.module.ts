import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AuthModule } from './auth.module';
import { TenantsModule } from './tenants.module';
import { SubscriptionsModule } from './subscriptions.module';
import { UsersModule } from './users.module';
import { AdminModule } from './admin.module';
import { LoggingMiddleware } from './logging.middleware';

@Module({
  imports: [AuthModule, TenantsModule, SubscriptionsModule, UsersModule, AdminModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
