import { IsString, IsArray, IsOptional, IsEnum, IsBoolean, IsObject } from 'class-validator';

export enum RegenerationType {
  FULL = 'full',
  CAPTIONS_ONLY = 'captions_only',
  IMAGES_ONLY = 'images_only',
  SELECTIVE = 'selective',
}

export class SelectiveRegenerationDto {
  @IsString()
  campaignId!: string;

  @IsString()
  userId!: string;

  @IsEnum(RegenerationType)
  regenerationType!: RegenerationType;

  @IsOptional()
  @IsString()
  aiModel?: string; // Override AI model for this regeneration

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  regenerateTextAssets?: string[]; // If type is selective, which text assets

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  regenerateImageAssets?: string[]; // If type is selective, which images

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  regenerateVideoAssets?: string[]; // If type is selective, which videos

  @IsOptional()
  @IsObject()
  regenerationMeta?: {
    prompt?: string;
    context?: string;
    [key: string]: any;
  };

  @IsOptional()
  @IsString()
  note?: string;
}

export class ReplaceAssetDto {
  @IsString()
  campaignId!: string;

  @IsString()
  contentVersion!: number; // Content version to update

  @IsString()
  oldAssetUrl!: string; // Asset to replace

  @IsString()
  newAssetUrl!: string; // New asset URL (already uploaded)

  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsBoolean()
  skipApprovalInvalidation?: boolean; // If true, don't mark approvals as needs_review
}

export class RegenerationResponseDto {
  campaignId!: string;
  contentVersion!: number;
  regenerationType!: RegenerationType;
  regeneratedAssets!: {
    type: 'text' | 'image' | 'video';
    assetUrl: string;
    aiModel?: string;
    generatedAt: Date;
  }[];
  preservedAssets!: {
    type: 'text' | 'image' | 'video';
    assetUrl: string;
  }[];
  metadata?: Record<string, any>;
  approvalStatus!: 'pending' | 'invalidated' | 'preserved';
  message!: string;
}
