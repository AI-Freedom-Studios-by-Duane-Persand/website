/**
 * Common Decorators
 * 
 * Barrel export for custom parameter decorators.
 * Simplifies imports across the application.
 * 
 * Usage:
 * ```typescript
 * import { TenantId, CurrentUser } from '@app/common/decorators';
 * ```
 */

export { TenantId } from './tenant-id.decorator';
export { CurrentUser } from './current-user.decorator';
