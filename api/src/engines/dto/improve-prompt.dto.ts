import { Type, Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested, ValidateIf } from 'class-validator';

export class ContextDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetAudience?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  tone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  style?: string;
}

export class ImprovePromptDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  prompt!: string;

  // Transform empty/null to undefined FIRST
  @Transform(({ value }) => {
    if (value === '' || value === null) {
      return undefined;
    }
    return value;
  }, { toClassOnly: true })
  @IsOptional()
  // Only run ValidateNested if value is actually an object (not undefined, null, or string)
  @ValidateIf((o) => o.context !== undefined && o.context !== null && typeof o.context === 'object')
  @ValidateNested()
  @Type(() => ContextDto)
  context?: ContextDto;
}
