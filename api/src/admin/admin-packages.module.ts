import { Module } from '@nestjs/common';
import { ModelsModule } from '../models/models.module';
import { AdminPackagesController } from './admin-packages.controller';

@Module({
  imports: [ModelsModule],
  controllers: [AdminPackagesController],
})
export class AdminPackagesModule {}
