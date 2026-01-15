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
import {
  CreateVideoWorkflowWithMetadataDto,
  RefinePromptDto as RefinePromptDtoValidator,
  GenerateFramesDto as GenerateFramesDtoValidator,
  ReviewFramesDto as ReviewFramesDtoValidator,
  GenerateVideoDto as GenerateVideoDtoValidator,
  RegenerateFramesDto,
} from './video-workflow.dto';
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
  async createWorkflow(@CurrentUser() user: JwtPayload, @Body() dto: CreateVideoWorkflowWithMetadataDto) {
    return this.videoWorkflowService.createWorkflow({
      ...dto,
      userId: user.sub!,
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
    return this.videoWorkflowService.getUserWorkflows(user.sub!, campaignId);
  }

  /**
   * Get specific workflow
   */
  @Get(':workflowId')
  async getWorkflow(@CurrentUser() user: JwtPayload, @Param('workflowId') workflowId: string) {
    return this.videoWorkflowService.getWorkflow(workflowId, user.sub!);
  }

  /**
   * Step 1: Refine the prompt using AI
   */
  @Post(':workflowId/refine-prompt')
  async refinePrompt(
    @CurrentUser() user: JwtPayload,
    @Param('workflowId') workflowId: string,
    @Body() dto: RefinePromptDtoValidator,
  ) {
    return this.videoWorkflowService.refinePrompt(workflowId, user.sub!, dto);
  }

  /**
   * Step 2: Generate sample frames
   */
  @Post(':workflowId/generate-frames')
  async generateFrames(
    @CurrentUser() user: JwtPayload,
    @Param('workflowId') workflowId: string,
    @Body() dto: GenerateFramesDtoValidator,
  ) {
    return this.videoWorkflowService.generateFrames(workflowId, user.sub!, dto);
  }

  /**
   * Step 3: Review frames
   */
  @Post(':workflowId/review-frames')
  async reviewFrames(
    @CurrentUser() user: JwtPayload,
    @Param('workflowId') workflowId: string,
    @Body() dto: ReviewFramesDtoValidator,
  ) {
    return this.videoWorkflowService.reviewFrames(workflowId, user.sub!, dto);
  }

  /**
   * Regenerate specific frames with feedback or custom prompts
   */
  @Post(':workflowId/regenerate-frames')
  async regenerateFrames(
    @CurrentUser() user: JwtPayload,
    @Param('workflowId') workflowId: string,
    @Body() dto: RegenerateFramesDto,
  ) {
    return this.videoWorkflowService.regenerateFrames(
      workflowId,
      user.sub!,
      dto.frameNumbers,
      dto.customPrompts,
    );
  }

  /**
   * Step 4: Generate final video
   */
  @Post(':workflowId/generate-video')
  async generateVideo(
    @CurrentUser() user: JwtPayload,
    @Param('workflowId') workflowId: string,
    @Body() dto: GenerateVideoDtoValidator,
  ) {
    return this.videoWorkflowService.generateVideo(workflowId, user.sub!, dto);
  }

  /**
   * Delete workflow
   */
  @Delete(':workflowId')
  async deleteWorkflow(@CurrentUser() user: JwtPayload, @Param('workflowId') workflowId: string) {
    await this.videoWorkflowService.deleteWorkflow(workflowId, user.sub!);
    return { message: 'Workflow deleted successfully' };
  }
}
