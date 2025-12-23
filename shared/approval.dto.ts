import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum ApprovalSection {
  STRATEGY = 'strategy',
  CONTENT = 'content',
  SCHEDULE = 'schedule',
  ADS = 'ads',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEEDS_REVIEW = 'needs_review',
}

export class ApproveDto {
  @IsEnum(ApprovalSection)
  section!: ApprovalSection;

  @IsString()
  campaignId!: string;

  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class RejectDto extends ApproveDto {
  @IsString()
  reason!: string;
}
