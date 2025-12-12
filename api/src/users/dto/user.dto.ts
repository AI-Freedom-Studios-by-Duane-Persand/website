import { IsEmail, IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsOptional()
  passwordHash?: string;

  @IsEnum(['superadmin', 'tenantOwner', 'manager', 'editor'])
  role!: 'superadmin' | 'tenantOwner' | 'manager' | 'editor';

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString({ each: true })
  roles?: string[];
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
