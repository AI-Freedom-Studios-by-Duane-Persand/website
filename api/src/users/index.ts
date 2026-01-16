/**
 * Users Module - Barrel Export
 * 
 * Centralizes exports for the users feature module.
 * 
 * @example
 * import { UsersService, CreateUserDto, UserRole } from '@app/users';
 */

// Module, Controller, Service
export { UsersModule } from './users.module';
export { UsersService } from './users.service';
export { UsersController } from './users.controller';

// Repository
export { UserRepository } from './repositories/user.repository';

// DTOs
export { 
  CreateUserDto, 
  UpdateUserDto,
  UserRole
} from './dtos/user.dto';

// Schemas
export { UserDocument, UserSchema } from './schemas/user.schema';
