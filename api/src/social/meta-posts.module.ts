import { Module } from '@nestjs/common';
import { MetaPostsController } from './meta-posts.controller';
import { MetaPostsService } from './meta-posts.service';
import { AyrshareService } from './ayrshare.service';
import { SocialPublisher } from './social.publisher';

@Module({
  controllers: [MetaPostsController],
  providers: [MetaPostsService, SocialPublisher, AyrshareService],
  exports: [MetaPostsService],
})
export class MetaPostsModule {}