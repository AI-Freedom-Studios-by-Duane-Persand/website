import {
  IsString,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  IsDateString,
  MaxLength
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

/**
 * Subscription status enum
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

/**
 * DTO for creating a new subscription
 * 
 * @remarks
 * - userId: Required - ID of the user
 * - packageId: Required - ID of the selected package/plan
 * - status: Required - Must be one of: active, pending, cancelled, expired
 */
export class CreateSubscriptionDto {
  /**
   * User ID - required
   */
  @IsNotEmpty({ message: 'User ID is required' })
  @IsString({ message: 'User ID must be a string' })
  userId!: string;

  /**
   * Package ID - required
   */
  @IsNotEmpty({ message: 'Package ID is required' })
  @IsString({ message: 'Package ID must be a string' })
  packageId!: string;

  /**
   * Subscription status - required
   */
  @IsNotEmpty({ message: 'Status is required' })
  @IsEnum(SubscriptionStatus, { message: 'Status must be one of: active, pending, cancelled, expired' })
  status!: 'active' | 'pending' | 'cancelled' | 'expired';

  /**
   * Stripe session ID - optional
   */
  @IsOptional()
  @IsString({ message: 'Stripe session ID must be a string' })
  @MaxLength(500, { message: 'Stripe session ID must not exceed 500 characters' })
  stripeSessionId?: string;

  /**
   * Payment link - optional
   */
  @IsOptional()
  @IsString({ message: 'Payment link must be a string' })
  @MaxLength(1000, { message: 'Payment link must not exceed 1000 characters' })
  paymentLink?: string;

  /**
   * Valid until date - optional, ISO 8601 format
   */
  @IsOptional()
  @IsDateString({}, { message: 'Valid until must be a valid date string (ISO 8601)' })
  validUntil?: string;
}

/**
 * DTO for updating an existing subscription
 * All fields are optional
 */
export class UpdateSubscriptionDto extends PartialType(CreateSubscriptionDto) {}
