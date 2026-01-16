import { 
  IsString, 
  IsOptional, 
  IsArray, 
  IsNotEmpty, 
  IsEnum, 
  MinLength, 
  MaxLength, 
  IsObject,
  ArrayMinSize,
  ValidateIf
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

/**
 * Campaign creation modes
 */
export enum CampaignMode {
  AI = 'ai',
  MANUAL = 'manual',
  HYBRID = 'hybrid'
}

/**
 * Campaign status enum
 */
export enum CampaignStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

/**
 * DTO for creating a new campaign
 * 
 * @remarks
 * - name: Required, 3-100 characters
 * - status: Optional, defaults to 'draft'
 * - platforms: Optional array of platform names
 * - mode: Optional, defaults to 'ai'
 */
export class CreateCampaignDto {
  /**
   * Campaign name - required, must be 3-100 characters
   */
  @IsNotEmpty({ message: 'Campaign name is required' })
  @IsString({ message: 'Campaign name must be a string' })
  @MinLength(3, { message: 'Campaign name must be at least 3 characters' })
  @MaxLength(100, { message: 'Campaign name must not exceed 100 characters' })
  name!: string;

  /**
   * Campaign status - optional, defaults to 'draft'
   */
  @IsOptional()
  @IsEnum(CampaignStatus, { message: 'Status must be a valid campaign status' })
  status?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title?: string; // Legacy support

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string; // Legacy support

  @IsOptional()
  budget?: number; // Legacy support

  @IsOptional()
  @IsString()
  createdBy?: string;

  // Strategy fields (optional - can be added later via strategy version)
  @IsOptional()
  @IsArray({ message: 'Platforms must be an array' })
  @ArrayMinSize(1, { message: 'At least one platform must be specified' })
  @IsString({ each: true, message: 'Each platform must be a string' })
  platforms?: string[];

  @IsOptional()
  @IsArray({ message: 'Goals must be an array' })
  @IsString({ each: true, message: 'Each goal must be a string' })
  goals?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Target audience description must not exceed 500 characters' })
  targetAudience?: string;

  @IsOptional()
  @IsArray({ message: 'Content pillars must be an array' })
  @IsString({ each: true, message: 'Each content pillar must be a string' })
  contentPillars?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Brand tone must not exceed 200 characters' })
  brandTone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Constraints must not exceed 500 characters' })
  constraints?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Cadence must not exceed 200 characters' })
  cadence?: string;

  @IsOptional()
  @IsObject({ message: 'Ads config must be an object' })
  adsConfig?: any;

  /**
   * Campaign mode - ai, manual, or hybrid
   */
  @IsOptional()
  @IsEnum(CampaignMode, { message: 'Mode must be one of: ai, manual, hybrid' })
  mode?: 'ai' | 'manual' | 'hybrid';

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Model name must not be empty' })
  model?: string; // AI model used

  @IsOptional()
  @IsString()
  campaignId?: string; // For linking assets and generated content
}

export class UpdateCampaignDto extends PartialType(CreateCampaignDto) {}
