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

  // Accept context as either a string or ContextDto object
  @Transform(({ value }) => {
    if (value === '' || value === null) {
      return undefined;
    }
    // If it's already an object with expected properties, keep it
    if (typeof value === 'object' && value !== null) {
      return value;
    }
    // If it's a string, try to parse as JSON, otherwise treat as plain string
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        // If JSON parse fails, return as-is (will be converted to object if possible)
        return value;
      }
    }
    return value;
  }, { toClassOnly: true })
  @IsOptional()
  context?: ContextDto | string | Record<string, any>;
}
