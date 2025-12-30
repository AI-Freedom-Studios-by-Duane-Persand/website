import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MediaRendererService } from './media-renderer.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'RenderJob', schema: require('../models/renderJob.model').RenderJobSchema },
      { name: 'Creative', schema: require('../creatives/schemas/creative.schema').CreativeSchema },
    ]),
  ],
  providers: [MediaRendererService],
  exports: [MediaRendererService],
})
export class MediaModule {}
