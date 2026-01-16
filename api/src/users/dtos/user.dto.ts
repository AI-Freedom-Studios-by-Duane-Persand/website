import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
  IsNotEmpty,
  Matches
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

/**
 * User roles in the system
 */
export enum UserRole {
  SUPER_ADMIN = 'superadmin',
  TENANT_OWNER = 'tenantOwner',
  MANAGER = 'manager',
  EDITOR = 'editor'
}

/**
 * DTO for creating a new user
 * 
 * @remarks
 * - email: Must be valid email format
 * - password: Minimum 8 characters, requires uppercase, lowercase, number
 * - role: Must be one of the defined UserRole enum values
 */
export class CreateUserDto {
  /**
   * User's full name - required, 2-100 characters
   */
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name!: string;

  /**
   * User's email address - required, must be valid email format
   */
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @MaxLength(255, { message: 'Email must not exceed 255 characters' })
  email!: string;

  /**
   * User's password - required, min 8 chars, must contain uppercase, lowercase, and number
   */
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  })
  password!: string;

  /**
   * User's role in the system
   */
  @IsNotEmpty({ message: 'Role is required' })
  @IsEnum(UserRole, { message: 'Role must be one of: superadmin, tenantOwner, manager, editor' })
  role!: 'superadmin' | 'tenantOwner' | 'manager' | 'editor';

  /**
   * Tenant ID - optional, assigned automatically if not provided
   */
  @IsOptional()
  @IsString({ message: 'Tenant ID must be a string' })
  tenantId?: string;

  /**
   * Early access flag - optional, defaults to false
   */
  @IsOptional()
  @IsBoolean({ message: 'isEarlyAccess must be a boolean' })
  isEarlyAccess?: boolean;
}

/**
 * DTO for updating an existing user
 * All fields are optional
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
