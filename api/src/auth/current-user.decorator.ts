import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtPayload } from './types';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }
    
    const sub: string | undefined = user?.sub;
    if (!sub) {
      throw new UnauthorizedException('Invalid authentication token: missing user ID');
    }
    
    return {
      userId: sub,
      email: user?.email,
      tenantId: user?.tenantId,
      roles: user?.roles,
    };
  },
);
