// api/src/users/users.module.ts
import { Module, Logger, Injectable } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelsModule } from '../models/models.module';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { UserSchema } from './schemas/user.schema';
import { UserRepository } from './repositories/user.repository';

@Injectable()
export class UsersModuleLogger {
  constructor() {
    Logger.log('UsersModule initialized', 'UsersModuleLogger');
  }
}

@Module({
  imports: [ModelsModule, InfrastructureModule],
  providers: [UsersService, UsersModuleLogger, UserRepository],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
