// UsersModule scaffold
import { Module } from '@nestjs/common';
import { UsersService } from './src/users/users.service';
import { UsersController } from './src/users/users.controller';

@Module({
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
