import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VideoWorkflowDocument = VideoWorkflow & Document;

export enum WorkflowStep {
  INITIAL_PROMPT = 'initial_prompt',
  PROMPT_REFINEMENT = 'prompt_refinement',
  ADDITIONAL_INFO = 'additional_info',
  FRAME_GENERATION = 'frame_generation',
  FRAME_REVIEW = 'frame_review',
  VIDEO_GENERATION = 'video_generation',
  COMPLETED = 'completed',
}

export enum WorkflowStatus {
  IN_PROGRESS = 'in_progress',
  WAITING_USER_INPUT = 'waiting_user_input',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface RefinementIteration {
  iteration: number;
  userPrompt: string;
  refinedPrompt: string;
  refinementModel: string;
  additionalInfo?: string;
  timestamp: Date;
}

export interface GeneratedFrame {
  frameNumber: number;
  prompt: string;
  imageUrl: string;
  model: string;
  approved: boolean;
  feedback?: string;
  timestamp: Date;
}

export interface VideoOutput {
  videoUrl: string;
  model: string;
  duration: number;
  fps: number;
  finalPrompt: string;
  timestamp: Date;
}

@Schema({ timestamps: true })
export class VideoWorkflow {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Campaign', default: null })
  campaignId?: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true, enum: WorkflowStep, default: WorkflowStep.INITIAL_PROMPT })
  currentStep!: WorkflowStep;

  @Prop({ required: true, enum: WorkflowStatus, default: WorkflowStatus.IN_PROGRESS })
  status!: WorkflowStatus;

  // Initial user input
  @Prop({ required: true })
  initialPrompt!: string;

  @Prop({ type: Object, default: {} })
  initialMetadata!: {
    targetAudience?: string;
    tone?: string;
    duration?: number;
    style?: string;
    aspectRatio?: string;
  };

  // Refinement iterations
  @Prop({ type: [Object], default: [] })
  refinementIterations!: RefinementIteration[];

  @Prop()
  finalRefinedPrompt?: string;

  // Frame generation
  @Prop({ type: [Object], default: [] })
  generatedFrames!: GeneratedFrame[];

  @Prop({ default: false })
  framesApproved!: boolean;

  // Video generation
  @Prop({ type: Object, default: null })
  videoOutput?: VideoOutput;

  // Model selections
  @Prop({ type: Object, default: {} })
  modelSelections!: {
    refinementModel?: string; // e.g., 'gpt-4o', 'claude-3-opus-20240229'
    frameModel?: string; // e.g., 'dall-e-3', 'stable-diffusion-xl'
    videoModel?: string; // e.g., 'veo-3', 'Video-Generator-PRO'
  };

  // Error tracking
  @Prop({ type: [String], default: [] })
  errors!: string[];

  @Prop()
  lastActivity!: Date;
}

export const VideoWorkflowSchema = SchemaFactory.createForClass(VideoWorkflow);

// Indexes for better query performance
VideoWorkflowSchema.index({ userId: 1, createdAt: -1 });
VideoWorkflowSchema.index({ status: 1, lastActivity: -1 });
VideoWorkflowSchema.index({ campaignId: 1 });
