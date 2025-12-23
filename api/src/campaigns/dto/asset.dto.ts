import { IsString, IsArray, IsOptional, IsEnum } from 'class-validator';

export enum AssetType {
  IMAGE = 'image',
  VIDEO = 'video',
  TEXT = 'text',
  OTHER = 'other',
}

export class CreateAssetDto {
  @IsString()
  url!: string;

  @IsEnum(AssetType)
  type!: AssetType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsString()
  uploadedBy!: string;
}

export class TagAssetDto {
  @IsString()
  campaignId!: string;

  @IsString()
  assetUrl!: string;

  @IsArray()
  @IsString({ each: true })
  tags!: string[];

  @IsString()
  userId!: string;
}

export class ReplaceAssetDto {
  @IsString()
  campaignId!: string;

  @IsString()
  oldAssetUrl!: string;

  @IsString()
  newAssetUrl!: string;

  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class LinkAssetToVersionDto {
  @IsString()
  campaignId!: string;

  @IsString()
  assetUrl!: string;

  @IsOptional()
  contentVersion?: number;

  @IsOptional()
  strategyVersion?: number;

  @IsString()
  userId!: string;
}
