/**
 * Infrastructure Layer Exports
 * 
 * Barrel export for infrastructure layer utilities:
 * - Decorators: Transaction management
 * - Context: Tenant context for request scoping
 * - Repositories: Base repository implementation
 * - Interfaces: Infrastructure-level interfaces
 */

// Decorators
export { Transactional, TransactionalMethod, TransactionalWithOptions, SafeTransactional } from './decorators/transactional.decorator';
export type { TransactionContext, TransactionalOptions } from './decorators/transactional.decorator';

// Context
export { TenantContextService, ConfigurableTenantContextService, createTenantFilter } from './context/tenant-context';
export type { RequestContext, TenantContextOptions } from './context/tenant-context';

// Repositories
export { MongooseBaseRepository, AdvancedMongooseRepository } from './repositories/base.repository';

// Interfaces
export type { JwtPayload } from './interfaces/jwt-payload.interface';
