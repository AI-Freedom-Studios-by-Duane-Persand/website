import { IsString, IsArray, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateStrategyVersionDto {
  @IsArray()
  @IsString({ each: true })
  platforms!: string[];

  @IsArray()
  @IsString({ each: true })
  goals!: string[];

  @IsString()
  targetAudience!: string;

  @IsArray()
  @IsString({ each: true })
  contentPillars!: string[];

  @IsString()
  brandTone!: string;

  @IsOptional()
  @IsString()
  constraints?: string;

  @IsString()
  cadence!: string;

  @IsOptional()
  adsConfig?: any;
}

export class AddStrategyVersionDto extends CreateStrategyVersionDto {
  @IsString()
  campaignId!: string;

  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
