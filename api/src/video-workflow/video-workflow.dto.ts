import { IsString, IsOptional, IsNotEmpty, IsNumber, Min, Max, IsArray, ValidateNested, IsBoolean, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVideoWorkflowDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  initialPrompt!: string;

  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsString()
  tone?: string;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(300)
  duration?: number;

  @IsOptional()
  @IsString()
  style?: string;

  @IsOptional()
  @IsString()
  aspectRatio?: string;
}

export class RefinePromptDto {
  @IsOptional()
  @IsString()
  additionalInfo?: string;

  @IsOptional()
  @IsString()
  refinementModel?: string;
}

export class GenerateFramesDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  frameCount?: number;

  @IsOptional()
  @IsString()
  frameModel?: string;
}

export class FrameApprovalDto {
  @IsNumber()
  @Min(1)
  frameNumber!: number;

  @IsBoolean()
  approved!: boolean;

  @IsOptional()
  @IsString()
  feedback?: string;
}

export class ReviewFramesDto {
  @IsNotEmpty()
  frameApprovals!: Array<FrameApprovalDto> | Record<number, boolean | { approved: boolean; feedback?: string }>;
}

export class GenerateVideoDto {
  @IsOptional()
  @IsString()
  videoModel?: string;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(300)
  duration?: number;

  @IsOptional()
  @IsNumber()
  @Min(24)
  @Max(60)
  fps?: number;
}

export class RegenerateFramesDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  frameNumbers!: number[];

  @IsOptional()
  @IsObject()
  customPrompts?: Record<number, string>;
}
