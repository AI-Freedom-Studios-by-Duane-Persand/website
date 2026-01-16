/**
 * Tenant ID Decorator
 * 
 * Custom parameter decorator to extract tenantId from JWT token.
 * Validates that the user is authenticated and has a tenantId.
 * 
 * Usage:
 * ```typescript
 * @Get()
 * @UseGuards(AuthGuard('jwt'))
 * async findAll(@TenantId() tenantId: string) {
 *   return this.service.findAll(tenantId);
 * }
 * ```
 * 
 * Throws BadRequestException if:
 * - User is not authenticated
 * - TenantId is missing from JWT payload
 */

import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import { UserJwt } from '../../../../shared/user-jwt.interface';

export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user: UserJwt = request.user;

    if (!user) {
      throw new BadRequestException('Authentication required: user not found in request');
    }

    if (!user.tenantId) {
      throw new BadRequestException('Authentication required: tenantId missing from token');
    }

    return user.tenantId;
  },
);
