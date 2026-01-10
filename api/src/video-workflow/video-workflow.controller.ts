import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
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
import { CurrentUser, JwtPayload } from '../auth';

@Controller('video-workflows')
@UseGuards(JwtAuthGuard)
export class VideoWorkflowController {
  constructor(private readonly videoWorkflowService: VideoWorkflowService) {}

  /**
   * Create a new video workflow
   */
  @Post()
  async createWorkflow(@CurrentUser() user: JwtPayload, @Body() dto: Omit<CreateWorkflowDto, 'userId'>) {
    return this.videoWorkflowService.createWorkflow({
      ...dto,
      userId: user.userId,
    });
  }

  /**
   * Get user's video workflows
   */
  @Get()
  async getUserWorkflows(
    @CurrentUser() user: JwtPayload,
    @Query('campaignId') campaignId?: string,
  ) {
    return this.videoWorkflowService.getUserWorkflows(user.userId, campaignId);
  }

  /**
   * Get specific workflow
   */
  @Get(':workflowId')
  async getWorkflow(@CurrentUser() user: JwtPayload, @Param('workflowId') workflowId: string) {
    return this.videoWorkflowService.getWorkflow(workflowId, user.userId);
  }

  /**
   * Step 1: Refine the prompt using AI
   */
  @Post(':workflowId/refine-prompt')
  async refinePrompt(
    @CurrentUser() user: JwtPayload,
    @Param('workflowId') workflowId: string,
    @Body() dto: RefinePromptDto,
  ) {
    return this.videoWorkflowService.refinePrompt(workflowId, user.userId, dto);
  }

  /**
   * Step 2: Generate sample frames
   */
  @Post(':workflowId/generate-frames')
  async generateFrames(
    @CurrentUser() user: JwtPayload,
    @Param('workflowId') workflowId: string,
    @Body() dto: GenerateFramesDto,
  ) {
    return this.videoWorkflowService.generateFrames(workflowId, user.userId, dto);
  }

  /**
   * Step 3: Review frames
   */
  @Post(':workflowId/review-frames')
  async reviewFrames(
    @CurrentUser() user: JwtPayload,
    @Param('workflowId') workflowId: string,
    @Body() dto: ReviewFramesDto,
  ) {
    return this.videoWorkflowService.reviewFrames(workflowId, user.userId, dto);
  }

  /**
   * Regenerate specific frames with feedback or custom prompts
   */
  @Post(':workflowId/regenerate-frames')
  async regenerateFrames(
    @CurrentUser() user: JwtPayload,
    @Param('workflowId') workflowId: string,
    @Body() body: { frameNumbers: number[]; customPrompts?: Record<number, string> },
  ) {
    return this.videoWorkflowService.regenerateFrames(
      workflowId,
      user.userId,
      body.frameNumbers,
      body.customPrompts,
    );
  }

  /**
   * Step 4: Generate final video
   */
  @Post(':workflowId/generate-video')
  async generateVideo(
    @CurrentUser() user: JwtPayload,
    @Param('workflowId') workflowId: string,
    @Body() dto: GenerateVideoDto,
  ) {
    return this.videoWorkflowService.generateVideo(workflowId, user.userId, dto);
  }

  /**
   * Delete workflow
   */
  @Delete(':workflowId')
  async deleteWorkflow(@CurrentUser() user: JwtPayload, @Param('workflowId') workflowId: string) {
    await this.videoWorkflowService.deleteWorkflow(workflowId, user.userId);
    return { message: 'Workflow deleted successfully' };
  }
}
