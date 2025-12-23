import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAdCampaignDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  objective!: string;

  @IsString()
  @IsNotEmpty()
  status!: string;
}

export class ListAdCampaignsDto {
  @IsString()
  @IsNotEmpty()
  accessToken!: string;

  @IsString()
  @IsNotEmpty()
  adAccountId!: string;
}
