import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  VideoWorkflowService,
  CreateWorkflowDto,
  RefinePromptDto,
  GenerateFramesDto,
  ReviewFramesDto,
  GenerateVideoDto,
} from './video-workflow.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('video-workflows')
@UseGuards(JwtAuthGuard)
export class VideoWorkflowController {
  constructor(private readonly videoWorkflowService: VideoWorkflowService) {}

  /**
   * Create a new video workflow
   */
  @Post()
  async createWorkflow(@Request() req: any, @Body() dto: Omit<CreateWorkflowDto, 'userId'>) {
    return this.videoWorkflowService.createWorkflow({
      ...dto,
      userId: req.user.userId,
    });
  }

  /**
   * Get user's video workflows
   */
  @Get()
  async getUserWorkflows(
    @Request() req: any,
    @Query('campaignId') campaignId?: string,
  ) {
    return this.videoWorkflowService.getUserWorkflows(req.user.userId, campaignId);
  }

  /**
   * Get specific workflow
   */
  @Get(':workflowId')
  async getWorkflow(@Request() req: any, @Param('workflowId') workflowId: string) {
    return this.videoWorkflowService.getWorkflow(workflowId, req.user.userId);
  }

  /**
   * Step 1: Refine the prompt using AI
   */
  @Post(':workflowId/refine-prompt')
  async refinePrompt(
    @Request() req: any,
    @Param('workflowId') workflowId: string,
    @Body() dto: RefinePromptDto,
  ) {
    return this.videoWorkflowService.refinePrompt(workflowId, req.user.userId, dto);
  }

  /**
   * Step 2: Generate sample frames
   */
  @Post(':workflowId/generate-frames')
  async generateFrames(
    @Request() req: any,
    @Param('workflowId') workflowId: string,
    @Body() dto: GenerateFramesDto,
  ) {
    return this.videoWorkflowService.generateFrames(workflowId, req.user.userId, dto);
  }

  /**
   * Step 3: Review frames
   */
  @Post(':workflowId/review-frames')
  async reviewFrames(
    @Request() req: any,
    @Param('workflowId') workflowId: string,
    @Body() dto: ReviewFramesDto,
  ) {
    return this.videoWorkflowService.reviewFrames(workflowId, req.user.userId, dto);
  }

  /**
   * Regenerate specific frames with feedback or custom prompts
   */
  @Post(':workflowId/regenerate-frames')
  async regenerateFrames(
    @Request() req: any,
    @Param('workflowId') workflowId: string,
    @Body() body: { frameNumbers: number[]; customPrompts?: Record<number, string> },
  ) {
    return this.videoWorkflowService.regenerateFrames(
      workflowId,
      req.user.userId,
      body.frameNumbers,
      body.customPrompts,
    );
  }

  /**
   * Step 4: Generate final video
   */
  @Post(':workflowId/generate-video')
  async generateVideo(
    @Request() req: any,
    @Param('workflowId') workflowId: string,
    @Body() dto: GenerateVideoDto,
  ) {
    return this.videoWorkflowService.generateVideo(workflowId, req.user.userId, dto);
  }

  /**
   * Delete workflow
   */
  @Delete(':workflowId')
  async deleteWorkflow(@Request() req: any, @Param('workflowId') workflowId: string) {
    await this.videoWorkflowService.deleteWorkflow(workflowId, req.user.userId);
    return { message: 'Workflow deleted successfully' };
  }
}
