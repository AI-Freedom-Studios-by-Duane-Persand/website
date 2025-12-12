
import { Module } from '@nestjs/common';
import { TenantsModule } from '../tenants/tenants.module';
import { MongooseModule } from '@nestjs/mongoose';
import { CreativesService } from './creatives.service';
import { CreativesController } from './creatives.controller';
import { CreativeSchema } from '../models/creative.schema';
import { VideoService } from './video.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Creative', schema: CreativeSchema }]),
    TenantsModule,
  ],
  providers: [CreativesService, VideoService],
  controllers: [CreativesController],
  exports: [CreativesService, VideoService],
})
export class CreativesModule {}
