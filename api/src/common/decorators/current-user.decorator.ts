/**
 * Current User Decorator
 * 
 * Custom parameter decorator to extract the current user from JWT token.
 * Validates that the user is authenticated.
 * 
 * Usage:
 * ```typescript
 * @Get()
 * @UseGuards(AuthGuard('jwt'))
 * async getProfile(@CurrentUser() user: UserJwt) {
 *   return this.service.getProfile(user);
 * }
 * ```
 * 
 * Throws BadRequestException if user is not authenticated.
 */

import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import { UserJwt } from '../../../../shared/user-jwt.interface';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserJwt => {
    const request = ctx.switchToHttp().getRequest();
    const user: UserJwt = request.user;

    if (!user) {
      throw new BadRequestException('Authentication required: user not found in request');
    }

    return user;
  },
);
