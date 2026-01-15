import { PartialType } from '@nestjs/mapped-types';
import { Creative } from '../../../../shared/types';

export { Creative };
export type CreateCreativeDto = Omit<Creative, '_id' | 'createdAt' | 'updatedAt'>;
export class UpdateCreativeDto extends PartialType(Object) {}
