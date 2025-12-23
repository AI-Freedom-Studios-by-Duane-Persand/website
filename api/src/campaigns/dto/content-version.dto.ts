import { IsString, IsArray, IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';

export enum ContentMode {
  AI = 'ai',
  MANUAL = 'manual',
  HYBRID = 'hybrid',
}

export class CreateContentVersionDto {
  @IsEnum(ContentMode)
  mode!: ContentMode;

  @IsArray()
  @IsString({ each: true })
  textAssets!: string[];

  @IsArray()
  @IsString({ each: true })
  imageAssets!: string[];

  @IsArray()
  @IsString({ each: true })
  videoAssets!: string[];

  @IsOptional()
  @IsString()
  aiModel?: string;

  @IsOptional()
  regenerationMeta?: any;

  @IsNumber()
  strategyVersion!: number;

  @IsOptional()
  @IsBoolean()
  needsReview?: boolean;
}

export class AddContentVersionDto extends CreateContentVersionDto {
  @IsString()
  campaignId!: string;

  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
