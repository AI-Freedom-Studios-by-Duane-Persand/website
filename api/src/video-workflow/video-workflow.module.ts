import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VideoWorkflowController } from './video-workflow.controller';
import { VideoWorkflowService } from './video-workflow.service';
import { VideoWorkflow, VideoWorkflowSchema } from './video-workflow.schema';
import { EnginesModule } from '../engines/engines.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VideoWorkflow.name, schema: VideoWorkflowSchema },
    ]),
    EnginesModule,
  ],
  controllers: [VideoWorkflowController],
  providers: [VideoWorkflowService],
  exports: [VideoWorkflowService],
})
export class VideoWorkflowModule {}
