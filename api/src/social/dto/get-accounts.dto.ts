import { IsNotEmpty, IsString } from 'class-validator';

export class GetAccountsDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  tenantId!: string;
}
