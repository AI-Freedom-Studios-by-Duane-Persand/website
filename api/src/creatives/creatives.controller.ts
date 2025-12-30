import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CreativesService } from './creatives.service';
import { CreateCreativeDto, UpdateCreativeDto } from '../../../shared/creative.dto';
import { SubscriptionRequired } from '../auth/subscription-required.decorator';
import { SubscriptionRequiredGuard } from '../auth/subscription-required.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';

@Controller('creatives')
export class CreativesController {
  constructor(private readonly creativesService: CreativesService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.creativesService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.creativesService.findOne(id);
  }

  @Post()
  async create(@Body() createCreativeDto: CreateCreativeDto) {
    return this.creativesService.create(createCreativeDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateCreativeDto: UpdateCreativeDto) {
    return this.creativesService.update(id, updateCreativeDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.creativesService.remove(id);
  }

  // AI generation endpoints
  @Post('generate/text')
  @SubscriptionRequired('copy-engine')
  @UseGuards(SubscriptionRequiredGuard)
  async generateText(@Body() body: { tenantId: string; campaignId: string; model: string; prompt: string; platforms?: string[]; angleId?: string | null; guidance?: any }) {
    return this.creativesService.generateTextCreative(body);
  }

  @Post('generate/image')
  @SubscriptionRequired('creative-engine')
  @UseGuards(SubscriptionRequiredGuard)
  async generateImage(@Body() body: { tenantId: string; campaignId: string; model: string; prompt: string; layoutHint?: string; platforms?: string[]; angleId?: string | null }) {
    return this.creativesService.generateImageCreative(body);
  }

  @Post('generate/video')
  @SubscriptionRequired('creative-engine')
  @UseGuards(SubscriptionRequiredGuard)
  async generateVideo(@Body() body: { tenantId: string; campaignId: string; model: string; prompt: string; platforms?: string[]; angleId?: string | null }) {
    return this.creativesService.generateVideoCreative(body);
  }

  // Manual upload linking to creative
  @Put(':id/assets')
  @SubscriptionRequired('asset-upload')
  @UseGuards(SubscriptionRequiredGuard)
  async linkAsset(@Param('id') id: string, @Body() body: { url: string; type: 'image' | 'video' }) {
    return this.creativesService.linkUploadedAsset(id, body.url, body.type);
  }

  // Edit/regenerate AI content with prompt
  @Put(':id/regenerate')
  @SubscriptionRequired('copy-engine')
  @UseGuards(SubscriptionRequiredGuard)
  async regenerate(
    @Param('id') id: string,
    @Body() body: { model: string; prompt: string; scope?: 'caption' | 'hashtags' | 'prompt' | 'script' | 'all' }
  ) {
    return this.creativesService.regenerateWithPrompt(id, body.model, body.prompt, body.scope);
  }

  // Inline edits (no AI call)
  @Put(':id/edit-caption')
  async editCaption(@Param('id') id: string, @Body() body: { caption: string }) {
    return this.creativesService.editCaption(id, body.caption);
  }

  @Put(':id/edit-hashtags')
  async editHashtags(@Param('id') id: string, @Body() body: { hashtags: string[] }) {
    return this.creativesService.editHashtags(id, body.hashtags);
  }

  @Put(':id/edit-prompt')
  async editPrompt(@Param('id') id: string, @Body() body: { prompt: string }) {
    return this.creativesService.editPrompt(id, body.prompt);
  }

  // Trigger actual media generation for existing creatives
  @Post(':id/render')
  @UseGuards(JwtAuthGuard, SubscriptionRequiredGuard)
  @SubscriptionRequired('creative-engine')
  async renderMedia(
    @Param('id') id: string,
    @Body() body: { model?: string }
  ) {
    const creative = await this.creativesService.findOne(id);
    const model = body.model || 'gpt-4o';
    
    if (creative.type === 'image' && creative.visual?.prompt) {
      await this.creativesService.generateActualImage(
        id,
        creative.visual.prompt,
        model,
        creative.tenantId
      );
      return { message: 'Image generation started', status: 'processing' };
    } else if (creative.type === 'video' && creative.script) {
      const prompt = creative.visual?.prompt || 
        (typeof creative.script.body === 'string' ? creative.script.body : 
         Array.isArray(creative.script.body) ? creative.script.body.join(' ') : 'video');
      
      await this.creativesService.generateActualVideo(
        id,
        prompt,
        creative.script,
        model,
        creative.tenantId
      );
      return { message: 'Video generation started', status: 'processing' };
    }
    
    return { message: 'No prompt or script available for rendering', status: 'error' };
  }
}
