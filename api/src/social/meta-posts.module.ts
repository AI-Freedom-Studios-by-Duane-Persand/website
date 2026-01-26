import { Module } from '@nestjs/common';
import { MetaPostsController } from './meta-posts.controller';
import { MetaPostsService } from './meta-posts.service';

@Module({
  controllers: [MetaPostsController],
  providers: [MetaPostsService],
  exports: [MetaPostsService],
})
export class MetaPostsModule {}