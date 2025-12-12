// api/src/auth/jwt-auth.guard.ts
import { Injectable, ExecutionContext, Inject } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: any,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    this.logger?.debug?.('[JwtAuthGuard] canActivate called', {
      context: 'JwtAuthGuard',
      timestamp: new Date().toISOString(),
      headers: req?.headers,
      cookies: req?.cookies,
      url: req?.url,
      method: req?.method,
    });
    return super.canActivate(context);
  }
}
