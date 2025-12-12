import { Creative } from './types';
export type CreateCreativeDto = Omit<Creative, '_id' | 'createdAt' | 'updatedAt'>;
declare const UpdateCreativeDto_base: import("@nestjs/mapped-types").MappedType<Partial<Object>>;
export declare class UpdateCreativeDto extends UpdateCreativeDto_base {
}
export {};
//# sourceMappingURL=creative.dto.d.ts.map