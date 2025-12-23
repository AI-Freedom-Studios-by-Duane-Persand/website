
import { Module } from '@nestjs/common';
import { TenantsModule } from '../tenants/tenants.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelsModule } from '../models/models.module';
import { CreativesService } from './creatives.service';
import { CreativesController } from './creatives.controller';
import { CreativeSchema } from './schemas/creative.schema';
import { VideoService } from './video.service';
import { EnginesModule } from '../engines/engines.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TenantsModule,
    ModelsModule,
    EnginesModule,
    StorageModule,
  ],
  providers: [CreativesService, VideoService],
  controllers: [CreativesController],
  exports: [CreativesService, VideoService],
})
export class CreativesModule {}
