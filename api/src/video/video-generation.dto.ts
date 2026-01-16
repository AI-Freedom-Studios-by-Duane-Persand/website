import { IsString, IsOptional, IsArray, IsNumber, Min, Max } from 'class-validator';

export class GenerateVideoWithReferenceDto {
  @IsString()
  prompt!: string;

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(60)
  duration?: number; // 5-60 seconds (Sora 2), auto-adjusted per model

  @IsOptional()
  @IsString()
  model?: 'sora-2' | 'veo-3.1' | 'runway-gen3' | 'runway-gen2'; // Defaults to sora-2

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  referenceImageUrls?: string[]; // URLs to brand logo or reference images

  @IsOptional()
  refinementPrompt?: string; // Context for AI to refine the prompt

  @IsOptional()
  @IsString()
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

export class VideoGenerationResponseDto {
  videoUrl!: string;
  videoPath!: string;
  prompt!: string;
  refinedPrompt?: string;
  model!: string;
  duration!: number;
  referenceImages!: {
    url: string;
    uploadedAt: Date;
  }[];
  metadata!: {
    generatedAt: Date;
    provider: string;
    resolution?: string;
  };
}

export class VideoModelDto {
  key!: 'sora-2' | 'veo-3.1' | 'runway-gen3' | 'runway-gen2';
  name!: string;
  description!: string;
  durationRange!: { min: number; max: number };
  supportsReferenceImages!: boolean;
  quality!: 'highest' | 'high' | 'good';
}
