import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { SocialPublisher } from '../social/social.publisher';
import { MetaPostsService } from './meta-posts.service';

@Controller('meta-posts')
export class MetaPostsController {
  constructor(
    private readonly socialPublisher: SocialPublisher,
    private readonly metaPostsService: MetaPostsService,
  ) {}

  @Post()
  async createMetaPost(@Body() body: { content: string; metaPageId: string }) {
    const { content, metaPageId } = body;
    return this.socialPublisher.publishToMeta(content, metaPageId);
  }

  @Get()
  async findAllMetaPosts() {
    return this.metaPostsService.findAll();
  }

  @Get(':id')
  async findMetaPost(@Param('id') id: string) {
    return this.metaPostsService.findOne(id);
  }

  @Patch(':id')
  async updateMetaPost(
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    return this.metaPostsService.update(id, body);
  }

  @Delete(':id')
  async deleteMetaPost(@Param('id') id: string) {
    return this.metaPostsService.delete(id);
  }
}