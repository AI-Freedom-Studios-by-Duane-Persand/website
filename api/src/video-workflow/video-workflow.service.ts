import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  VideoWorkflow,
  VideoWorkflowDocument,
  WorkflowStep,
  WorkflowStatus,
  RefinementIteration,
  GeneratedFrame,
  VideoOutput,
} from './video-workflow.schema';
import { PoeClient } from '../engines/poe.client';
import { ReplicateClient } from '../engines/replicate.client';

export interface CreateWorkflowDto {
  userId: string;
  campaignId?: string;
  title: string;
  initialPrompt: string;
  targetAudience?: string;
  tone?: string;
  duration?: number;
  style?: string;
  aspectRatio?: string;
}

export interface RefinePromptDto {
  additionalInfo?: string;
  refinementModel?: string;
}

export interface GenerateFramesDto {
  frameCount?: number;
  frameModel?: string;
}

export interface ReviewFramesDto {
  frameApprovals: Array<{
    frameNumber: number;
    approved: boolean;
    feedback?: string;
  }>;
}

export interface GenerateVideoDto {
  videoModel?: string;
  duration?: number;
  fps?: number;
}

@Injectable()
export class VideoWorkflowService {
  private readonly logger = new Logger(VideoWorkflowService.name);
  
  // Video frame resolution constants
  private readonly VIDEO_WIDTH = 1280;
  private readonly VIDEO_HEIGHT = 720;

  constructor(
    @InjectModel(VideoWorkflow.name)
    private videoWorkflowModel: Model<VideoWorkflowDocument>,
    private readonly poeClient: PoeClient,
    private readonly replicateClient: ReplicateClient,
  ) {}

  /**
   * Create a new video workflow
   */
  async createWorkflow(dto: CreateWorkflowDto): Promise<VideoWorkflowDocument> {
    this.logger.log(`Creating video workflow: ${dto.title}`);

    const workflow = new this.videoWorkflowModel({
      userId: new Types.ObjectId(dto.userId),
      campaignId: dto.campaignId ? new Types.ObjectId(dto.campaignId) : undefined,
      title: dto.title,
      initialPrompt: dto.initialPrompt,
      initialMetadata: {
        targetAudience: dto.targetAudience,
        tone: dto.tone,
        duration: dto.duration,
        style: dto.style,
        aspectRatio: dto.aspectRatio,
      },
      currentStep: WorkflowStep.INITIAL_PROMPT,
      status: WorkflowStatus.IN_PROGRESS,
      lastActivity: new Date(),
    });

    await workflow.save();

    this.logger.log(`Workflow created: ${workflow._id}`);
    return workflow;
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(workflowId: string, userId: string): Promise<VideoWorkflowDocument> {
    const workflow = await this.videoWorkflowModel.findOne({
      _id: workflowId,
      userId: new Types.ObjectId(userId),
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow ${workflowId} not found`);
    }

    return workflow;
  }

  /**
   * Get all workflows for a user
   */
  async getUserWorkflows(userId: string, campaignId?: string): Promise<VideoWorkflowDocument[]> {
    const query: any = { userId: new Types.ObjectId(userId) };
    
    if (campaignId) {
      query.campaignId = new Types.ObjectId(campaignId);
    }

    return this.videoWorkflowModel
      .find(query)
      .sort({ lastActivity: -1 })
      .limit(50);
  }

  /**
   * Step 1: Refine the initial prompt using AI
   */
  async refinePrompt(
    workflowId: string,
    userId: string,
    dto: RefinePromptDto,
  ): Promise<VideoWorkflowDocument> {
    const workflow = await this.getWorkflow(workflowId, userId);

    this.logger.log(`Refining prompt for workflow: ${workflowId}`);

    // Update status to processing
    workflow.status = WorkflowStatus.PROCESSING;
    await workflow.save();

    try {
      // Select refinement model
      const model = dto.refinementModel || 
                    workflow.modelSelections.refinementModel || 
                    'gpt-4o';

      // Build refinement prompt
      const lastIteration = workflow.refinementIterations[workflow.refinementIterations.length - 1];
      const basePrompt = lastIteration?.refinedPrompt || workflow.initialPrompt;
      
      let refinementPrompt = `You are an expert video script and prompt engineer. 

Original video idea: "${workflow.initialPrompt}"

${lastIteration ? `Previous refined prompt: "${lastIteration.refinedPrompt}"` : ''}

${dto.additionalInfo ? `User's additional information: "${dto.additionalInfo}"` : ''}

Metadata:
- Target Audience: ${workflow.initialMetadata.targetAudience || 'General'}
- Tone: ${workflow.initialMetadata.tone || 'Professional'}
- Duration: ${workflow.initialMetadata.duration || 30} seconds
- Style: ${workflow.initialMetadata.style || 'Modern'}

Please refine this into a detailed video generation prompt that includes:
1. Visual elements and scenes
2. Pacing and timing
3. Style and aesthetics  
4. Key messaging or story beats
5. Mood and atmosphere

Return ONLY a refined prompt optimized for video generation, without any explanations or metadata.`;

      // Call Poe API for refinement
      const response = await this.poeClient.generateContent('creative-video', {
        model,
        contents: refinementPrompt,
      });

      // Extract refined prompt from response
      let refinedPrompt: string;
      try {
        const parsed = JSON.parse(response);
        refinedPrompt = parsed.hook + ' ' + parsed.body.join(' ') + ' ' + parsed.outro;
      } catch {
        refinedPrompt = response.trim();
      }

      // Add refinement iteration
      const iteration: RefinementIteration = {
        iteration: workflow.refinementIterations.length + 1,
        userPrompt: basePrompt,
        refinedPrompt,
        refinementModel: model,
        additionalInfo: dto.additionalInfo,
        timestamp: new Date(),
      };

      workflow.refinementIterations.push(iteration);
      workflow.finalRefinedPrompt = refinedPrompt;
      workflow.currentStep = WorkflowStep.PROMPT_REFINEMENT;
      workflow.status = WorkflowStatus.WAITING_USER_INPUT;
      workflow.lastActivity = new Date();

      // Update model selection
      if (dto.refinementModel) {
        workflow.modelSelections.refinementModel = dto.refinementModel;
      }

      await workflow.save();

      this.logger.log(`Prompt refined successfully: ${workflowId}, iteration ${iteration.iteration}`);
      return workflow;
    } catch (error: any) {
      this.logger.error(`Failed to refine prompt: ${error.message}`);
      workflow.status = WorkflowStatus.FAILED;
      workflow.errors.push(`Refinement failed: ${error.message}`);
      await workflow.save();
      throw error;
    }
  }

  /**
   * Step 2: Generate sample frames/images from refined prompt
   */
  async generateFrames(
    workflowId: string,
    userId: string,
    dto: GenerateFramesDto,
  ): Promise<VideoWorkflowDocument> {
    const workflow = await this.getWorkflow(workflowId, userId);

    if (!workflow.finalRefinedPrompt) {
      throw new BadRequestException('Prompt must be refined before generating frames');
    }

    this.logger.log(`Generating frames for workflow: ${workflowId}`);

    workflow.status = WorkflowStatus.PROCESSING;
    await workflow.save();

    try {
      const frameCount = dto.frameCount || 3;
      const model = dto.frameModel || workflow.modelSelections.frameModel || 'stable-diffusion-xl';

      // Update model selection
      if (dto.frameModel) {
        workflow.modelSelections.frameModel = dto.frameModel;
      }

      // Generate frame prompts based on refined prompt
      const framePrompts = await this.generateFramePrompts(
        workflow.finalRefinedPrompt,
        frameCount,
        workflow.initialMetadata.duration || 30,
      );

      // Generate images for each frame
      const frames: GeneratedFrame[] = [];
      for (let i = 0; i < framePrompts.length; i++) {
        this.logger.log(`Generating frame ${i + 1}/${framePrompts.length}`);

        try {
          // Use Replicate for image generation
          const imageUrl = await this.replicateClient.generateImage(framePrompts[i], {
            width: this.VIDEO_WIDTH,
            height: this.VIDEO_HEIGHT,
            guidanceScale: 7.5,
            numInferenceSteps: 50,
          });

          frames.push({
            frameNumber: i + 1,
            prompt: framePrompts[i],
            imageUrl,
            model,
            approved: false,
            timestamp: new Date(),
          });
        } catch (error: any) {
          this.logger.error(`Failed to generate frame ${i + 1}: ${error.message}`);
          workflow.errors.push(`Frame ${i + 1} generation failed: ${error.message}`);
        }
      }

      if (frames.length === 0) {
        throw new Error('Failed to generate any frames');
      }

      workflow.generatedFrames = frames;
      workflow.currentStep = WorkflowStep.FRAME_GENERATION;
      workflow.status = WorkflowStatus.WAITING_USER_INPUT;
      workflow.lastActivity = new Date();

      await workflow.save();

      this.logger.log(`Generated ${frames.length} frames for workflow: ${workflowId}`);
      return workflow;
    } catch (error: any) {
      this.logger.error(`Failed to generate frames: ${error.message}`);
      workflow.status = WorkflowStatus.FAILED;
      workflow.errors.push(`Frame generation failed: ${error.message}`);
      await workflow.save();
      throw error;
    }
  }

  /**
   * Generate frame prompts from refined video prompt
   */
  private async generateFramePrompts(
    videoPrompt: string,
    frameCount: number,
    durationSeconds: number,
  ): Promise<string[]> {
    const interval = durationSeconds / frameCount;
    const prompts: string[] = [];

    for (let i = 0; i < frameCount; i++) {
      const timestamp = Math.floor(i * interval);
      const position = i === 0 ? 'opening' : i === frameCount - 1 ? 'closing' : 'middle';

      prompts.push(
        `${videoPrompt}, ${position} scene at ${timestamp}s, cinematic composition, high quality, detailed, professional lighting`,
      );
    }

    return prompts;
  }

  /**
   * Step 3: Review and approve frames
   */
  async reviewFrames(
    workflowId: string,
    userId: string,
    dto: ReviewFramesDto,
  ): Promise<VideoWorkflowDocument> {
    const workflow = await this.getWorkflow(workflowId, userId);

    if (workflow.generatedFrames.length === 0) {
      throw new BadRequestException('No frames available for review');
    }

    this.logger.log(`Reviewing frames for workflow: ${workflowId}`);

    // Update frame approvals
    for (const approval of dto.frameApprovals) {
      const frame = workflow.generatedFrames.find(f => f.frameNumber === approval.frameNumber);
      if (frame) {
        frame.approved = approval.approved;
        frame.feedback = approval.feedback;
      }
    }

    // Check if all frames are approved
    const allApproved = workflow.generatedFrames.every(f => f.approved);
    workflow.framesApproved = allApproved;

    if (allApproved) {
      workflow.currentStep = WorkflowStep.FRAME_REVIEW;
      workflow.status = WorkflowStatus.WAITING_USER_INPUT;
      this.logger.log(`All frames approved for workflow: ${workflowId}`);
    } else {
      workflow.status = WorkflowStatus.WAITING_USER_INPUT;
      this.logger.log(`Some frames need revision for workflow: ${workflowId}`);
    }

    workflow.lastActivity = new Date();
    await workflow.save();

    return workflow;
  }

  /**
   * Regenerate specific frames with feedback or custom prompts
   */
  async regenerateFrames(
    workflowId: string,
    userId: string,
    frameNumbers: number[],
    customPrompts?: Record<number, string>,
  ): Promise<VideoWorkflowDocument> {
    const workflow = await this.getWorkflow(workflowId, userId);

    this.logger.log(`Regenerating frames ${frameNumbers.join(', ')} for workflow: ${workflowId}`);

    workflow.status = WorkflowStatus.PROCESSING;
    await workflow.save();

    try {
      const model = workflow.modelSelections.frameModel || 'stable-diffusion-xl';

      for (const frameNumber of frameNumbers) {
        const frame = workflow.generatedFrames.find(f => f.frameNumber === frameNumber);
        if (!frame) continue;

        // Use custom prompt if provided, otherwise incorporate feedback
        let enhancedPrompt = customPrompts?.[frameNumber] || frame.prompt;
        if (!customPrompts?.[frameNumber] && frame.feedback) {
          enhancedPrompt = `${frame.prompt}. User feedback: ${frame.feedback}`;
        }

        try {
          const imageUrl = await this.replicateClient.generateImage(enhancedPrompt, {
            width: this.VIDEO_WIDTH,
            height: this.VIDEO_HEIGHT,
          });

          frame.imageUrl = imageUrl;
          frame.approved = false;
          frame.timestamp = new Date();
          frame.feedback = undefined;

          this.logger.log(`Regenerated frame ${frameNumber}`);
        } catch (error: any) {
          this.logger.error(`Failed to regenerate frame ${frameNumber}: ${error.message}`);
          workflow.errors.push(`Frame ${frameNumber} regeneration failed: ${error.message}`);
        }
      }

      workflow.status = WorkflowStatus.WAITING_USER_INPUT;
      workflow.lastActivity = new Date();
      await workflow.save();

      return workflow;
    } catch (error: any) {
      this.logger.error(`Failed to regenerate frames: ${error.message}`);
      workflow.status = WorkflowStatus.FAILED;
      workflow.errors.push(`Frame regeneration failed: ${error.message}`);
      await workflow.save();
      throw error;
    }
  }

  /**
   * Step 4: Generate final video
   */
  async generateVideo(
    workflowId: string,
    userId: string,
    dto: GenerateVideoDto,
  ): Promise<VideoWorkflowDocument> {
    const workflow = await this.getWorkflow(workflowId, userId);

    if (!workflow.framesApproved) {
      throw new BadRequestException('All frames must be approved before generating video');
    }

    this.logger.log(`Generating video for workflow: ${workflowId}`);

    workflow.status = WorkflowStatus.PROCESSING;
    await workflow.save();

    try {
      const model = dto.videoModel || workflow.modelSelections.videoModel || 'Video-Generator-PRO';
      const duration = dto.duration || workflow.initialMetadata.duration || 30;
      const fps = dto.fps || 24;

      // Update model selection
      if (dto.videoModel) {
        workflow.modelSelections.videoModel = dto.videoModel;
      }

      // Use the final refined prompt for video generation
      const finalPrompt = workflow.finalRefinedPrompt!;

      this.logger.log(`Generating video with model: ${model}, duration: ${duration}s, fps: ${fps}`);

      // Generate video using Replicate
      const videoUrl = await this.replicateClient.generateVideo(finalPrompt, {
        durationSeconds: duration,
        fps,
        guidanceScale: 6.0,
        numInferenceSteps: 24,
      });

      const videoOutput: VideoOutput = {
        videoUrl,
        model,
        duration,
        fps,
        finalPrompt,
        timestamp: new Date(),
      };

      workflow.videoOutput = videoOutput;
      workflow.currentStep = WorkflowStep.VIDEO_GENERATION;
      workflow.status = WorkflowStatus.COMPLETED;
      workflow.lastActivity = new Date();

      await workflow.save();

      this.logger.log(`Video generated successfully for workflow: ${workflowId}`);
      return workflow;
    } catch (error: any) {
      this.logger.error(`Failed to generate video: ${error.message}`);
      workflow.status = WorkflowStatus.FAILED;
      workflow.errors.push(`Video generation failed: ${error.message}`);
      await workflow.save();
      throw error;
    }
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(workflowId: string, userId: string): Promise<void> {
    const result = await this.videoWorkflowModel.deleteOne({
      _id: workflowId,
      userId: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Workflow ${workflowId} not found`);
    }

    this.logger.log(`Workflow deleted: ${workflowId}`);
  }
}
