import { PartialType } from '@nestjs/mapped-types';
import { Campaign } from './types';

export type CreateCampaignDto = Omit<Campaign, '_id' | 'createdAt' | 'updatedAt'>;
export class UpdateCampaignDto extends PartialType(Object) {}
