import { IsArray, IsNotEmpty, IsOptional, IsString, ArrayMinSize } from 'class-validator';
import { Exclude } from 'class-transformer';

export class ConnectAccountsDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @IsString()
  @IsNotEmpty()
  @Exclude({ toPlainOnly: true })
  userAccessToken!: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  metaUserId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  scopes!: string[];
}
