import { IsString, IsOptional, IsArray } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateCampaignDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  title?: string; // Legacy support

  @IsOptional()
  @IsString()
  description?: string; // Legacy support

  @IsOptional()
  budget?: number; // Legacy support

  @IsOptional()
  @IsString()
  createdBy?: string;

  // Strategy fields (optional - can be added later via strategy version)
  @IsOptional()
  @IsArray()
  platforms?: string[];

  @IsOptional()
  @IsArray()
  goals?: string[];

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsArray()
  contentPillars?: string[];

  @IsOptional()
  @IsString()
  brandTone?: string;

  @IsOptional()
  @IsString()
  constraints?: string;

  @IsOptional()
  @IsString()
  cadence?: string;

  @IsOptional()
  adsConfig?: any;

  @IsOptional()
  @IsString()
  mode?: 'ai' | 'manual' | 'hybrid';

  @IsOptional()
  @IsString()
  model?: string; // AI model used

  @IsOptional()
  @IsString()
  campaignId?: string; // For linking assets and generated content
}

export class UpdateCampaignDto extends PartialType(CreateCampaignDto) {}
