// api/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { LoggerModule } from '../logger.module';
// import { WinstonModule, WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
// import * as winston from 'winston';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '1d' },
    }),
    UsersModule,
    TenantsModule,
    LoggerModule,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
