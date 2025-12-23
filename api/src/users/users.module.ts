// api/src/users/users.module.ts
import { Module, Logger, Injectable } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelsModule } from '../models/models.module';
import { UserSchema } from './schemas/user.schema';

@Injectable()
export class UsersModuleLogger {
  constructor() {
    Logger.log('UsersModule initialized', 'UsersModuleLogger');
  }
}

@Module({
  imports: [ModelsModule],
  providers: [UsersService, UsersModuleLogger],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
