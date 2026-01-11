import { IsNotEmpty, IsOptional, IsString, IsEnum, MaxLength } from 'class-validator';

export enum ContentType {
  PROMPT_IMPROVEMENT = 'prompt-improvement',
  IMAGE_GENERATION = 'image-generation',
  VIDEO_GENERATION = 'video-generation',
  CAPTION_GENERATION = 'caption-generation',
  SCRIPT_GENERATION = 'script-generation',
  HASHTAG_GENERATION = 'hashtag-generation',
}

export enum ModelProvider {
  POE = 'poe',
  REPLICATE = 'replicate',
}

export class GetAvailableModelsDto {
  @IsNotEmpty()
  @IsEnum(ContentType)
  contentType!: ContentType;

  @IsOptional()
  @IsEnum(ModelProvider)
  provider?: ModelProvider;
}

export class SelectModelDto {
  @IsNotEmpty()
  @IsEnum(ContentType)
  contentType!: ContentType;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  model!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  prompt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  context?: string;
}

export class ModelInfoDto {
  model!: string;
  displayName!: string;
  provider!: string;
  capabilities!: {
    supportsText: boolean;
    supportsImages: boolean;
    supportsVideo: boolean;
    isMultimodal: boolean;
  };
  tier?: 'free' | 'pro' | 'enterprise';
  description?: string;
}

export class ContentTypeModelsDto {
  contentType!: ContentType;
  recommendedModel!: string;
  availableModels!: ModelInfoDto[];
}
