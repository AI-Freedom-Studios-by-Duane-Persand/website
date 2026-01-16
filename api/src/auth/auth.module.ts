// api/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from '../logger.module';
// import { WinstonModule, WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
// import * as winston from 'winston';
import { AuthService } from './auth.service';
import { AuthApplicationService } from './auth-application.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { EarlyAccessRequestSchema } from './early-access-requests.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'EarlyAccessRequest', schema: EarlyAccessRequestSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '1d' },
    }),
    UsersModule,
    TenantsModule,
    LoggerModule,
    SubscriptionsModule, // Added SubscriptionsModule to resolve dependency
  ],
  providers: [
    AuthService,
    AuthApplicationService,
    JwtStrategy,
    JwtAuthGuard,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
