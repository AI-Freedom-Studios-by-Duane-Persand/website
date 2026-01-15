import { IsString, IsArray, IsOptional, IsDate, IsBoolean } from 'class-validator';

export class CreateScheduleSlotDto {
  @IsDate()
  slot!: Date;

  @IsString()
  platform!: string;

  @IsOptional()
  @IsBoolean()
  locked?: boolean;
}

export class AddScheduleDto {
  @IsString()
  campaignId!: string;

  @IsArray()
  slots!: CreateScheduleSlotDto[];

  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateScheduleSlotDto {
  @IsString()
  campaignId!: string;

  @IsDate()
  originalSlot!: Date;

  @IsDate()
  newSlot!: Date;

  @IsString()
  userId!: string;
}

export class LockScheduleSlotDto {
  @IsString()
  campaignId!: string;

  @IsDate()
  slot!: Date;

  @IsString()
  userId!: string;
}

export class UnlockScheduleSlotDto {
  @IsString()
  campaignId!: string;

  @IsDate()
  slot!: Date;

  @IsString()
  userId!: string;
}
