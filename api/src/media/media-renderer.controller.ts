import { Controller, Post, Get, Body, Param, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { MediaRendererService, RenderJobInput } from './media-renderer.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('render-jobs')
@UseGuards(AuthGuard('jwt'))
export class MediaRendererController {
  constructor(private readonly mediaRendererService: MediaRendererService) {}

  @Post('create')
  async createRenderJob(@Body() input: RenderJobInput, @Req() req: any) {
    const tenantId = req.user?.tenantId || input.tenantId;
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }

    return this.mediaRendererService.createRenderJob(
      { ...input, tenantId },
      req.user?.id || 'system',
    );
  }

  @Post(':jobId/submit')
  async submitJob(@Param('jobId') jobId: string) {
    return this.mediaRendererService.submitJob(jobId);
  }

  @Get(':jobId/status')
  async getJobStatus(@Param('jobId') jobId: string) {
    return this.mediaRendererService.getJobStatus(jobId);
  }

  @Get(':jobId/poll')
  async pollJobStatus(@Param('jobId') jobId: string) {
    return this.mediaRendererService.pollJobStatus(jobId);
  }

  @Post(':jobId/cancel')
  async cancelJob(@Param('jobId') jobId: string) {
    return this.mediaRendererService.cancelJob(jobId);
  }

  @Post('webhook/:provider')
  async handleWebhook(@Param('provider') provider: string, @Body() payload: any) {
    return this.mediaRendererService.handleProviderWebhook(provider, payload);
  }
}
