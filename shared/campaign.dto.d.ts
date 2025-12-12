import { Campaign } from './types';
export type CreateCampaignDto = Omit<Campaign, '_id' | 'createdAt' | 'updatedAt'>;
declare const UpdateCampaignDto_base: import("@nestjs/mapped-types").MappedType<Partial<Object>>;
export declare class UpdateCampaignDto extends UpdateCampaignDto_base {
}
export {};
//# sourceMappingURL=campaign.dto.d.ts.map