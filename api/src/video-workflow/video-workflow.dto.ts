import { IsString, IsOptional, IsNotEmpty, IsNumber, Min, Max, IsArray, ValidateNested, IsBoolean, IsObject, Validate, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Custom validator: ensures value is Record<number, string> with all values being strings
 */
@ValidatorConstraint({ name: 'IsStringRecord', async: false })
export class IsStringRecordConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (value === null || value === undefined) {
      return true; // Optional, so null/undefined is valid
    }
    if (typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }
    // All values must be strings
    return Object.values(value).every((v) => typeof v === 'string');
  }

  defaultMessage(): string {
    return 'customPrompts must be a Record<number, string> where all values are strings';
  }
}

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
}

export class InitialMetadataDto {
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

export class CreateVideoWorkflowWithMetadataDto extends CreateVideoWorkflowDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => InitialMetadataDto)
  metadata?: InitialMetadataDto;
}

export class RefinePromptDto {
  @IsOptional()
  @IsString()
  additionalInfo?: string;

  @IsOptional()
  @IsString()
  refinementModel?: string;

  /**
   * Alias for refinementModel (for backward compatibility)
   * @deprecated Use refinementModel instead
   */
  @IsOptional()
  @IsString()
  model?: string;
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

  /**
   * Alias for frameModel (for backward compatibility)
   * @deprecated Use frameModel instead
   */
  @IsOptional()
  @IsString()
  model?: string;
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
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FrameApprovalDto)
  frameApprovals?: FrameApprovalDto[];

  /**
   * Alias for frameApprovals (for backward compatibility)
   * @deprecated Use frameApprovals instead
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FrameApprovalDto)
  frameReviews?: FrameApprovalDto[];
}

export class GenerateVideoDto {
  @IsOptional()
  @IsString()
  videoModel?: string;

  /**
   * Alias for videoModel (for backward compatibility)
   * @deprecated Use videoModel instead
   */
  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  @Min(4)
  @Max(300)
  duration?: number; // For Veo 3.1: only 4, 6, or 8 seconds are valid (will auto-adjust)

  @IsOptional()
  @IsNumber()
  @Min(24)
  @Max(60)
  fps?: number;

  @IsOptional()
  @IsString()
  resolution?: '720p' | '1080p';

  @IsOptional()
  @IsString()
  aspectRatio?: '9:16' | '16:9' | '1:1';

  @IsOptional()
  @IsBoolean()
  generateAudio?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  referenceImages?: string[];
}

export class RegenerateFramesDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  frameNumbers!: number[];

  @IsOptional()
  @IsObject()
  @Validate(IsStringRecordConstraint)
  customPrompts?: Record<number, string>;
}
